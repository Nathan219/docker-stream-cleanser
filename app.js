module.exports = function(data, encoding, fixCarriageReturns) {
  if (!Buffer.isBuffer(data)) {
    data = new Buffer(data, encoding);
  }
  var result = '';
  var header = null, pointer = 0;
  if (!data || data.length < 8 || data[1] !== 0) {
    return (fixCarriageReturns) ? data.toString().replace(/\r?\n/g, '\r\n') : data.toString();
  }
  while(pointer < data.length) {
    header = data.slice(pointer, pointer += 8);
    if (header[1] - header[2] - header[3] !== 0) {
      break;
    }
    var size = header.readUInt32BE(4);
    var payload = data.slice(pointer, pointer += size);
    if (payload === null) break;
    payload = (fixCarriageReturns) ?
      payload.toString().replace(/\r?\n/g, '\r\n') : payload.toString();
    result += payload;
  }
  return result;
};

/**
 * This takes data from an input stream, strips out the payload, then writes that payload
 * to the output stream.  Since this method is for real-time streaming, I gave it a chance to buffer
 * the data in case the message was broken up by docker (which seems to happen sometimes)
 * @param buildStream input stream
 * @param clientStream output stream
 * @param encoding encoding of the stream
 * @param fixCarriageReturns replaces all of the extra carriage returns with only one
 */
module.exports.cleanStreams = function (buildStream, clientStream, encoding, fixCarriageReturns) {
  var lastBuffer = null;
  buildStream.on('data', function(data) {
    if (!Buffer.isBuffer(data)) {
      data = new Buffer(data, encoding);
    }
    // Sometimes messages get chopped up by docker, even in the header, so we need to handle this

    //We need to make sure that this isn't a continuation of the message before it
    if (lastBuffer) {
      data = Buffer.concat([lastBuffer, data], lastBuffer.length + data.length);
      lastBuffer = null;
    }
    // If the header got chopped up, then we probably don't have a length.  But we should at least
    // have the first 4 bytes (hopefully).
    if (data.length > 0 && data[0] > 0 && data[0] < 4) {
      // If true, we at least have a legit docker message'
      if (data[1] - data[2] - data[3] === 0) {
        // We can at least read the size now.
        var header = data.slice(0, 8);
        var pointer = 8;
        while(header && header.length && header[1] - header[2] - header[3] === 0) {
          var size = header.readUInt32BE(4);
          if (pointer + size > data.length) {
            // check if the size greater than the rest of the message.  If it is, slice off the
            // whole message (-8 to grab the header as well), and store it in the buffer
            lastBuffer = data.slice(pointer - 8);
            header = null;
          } else {
            var payload = data.slice(pointer, pointer += size);
            if (payload === null) break;
            payload = (fixCarriageReturns) ?
              payload.toString().replace(/\r?\n/g, '\r\n') : payload.toString();
            clientStream.write(payload);

            if (data.length <= pointer) {
              header = null;
            } else if (data.length > pointer+8) {
              header = data.slice(pointer, pointer += 8);
            } else {
              // Somehow only part of a header is on the end of the message, so save it to the
              // buffer.
              lastBuffer = data.slice(pointer);
              header = null;
            }
          }
        }
      } else if (data.length < 8 ) {
        // If we don't even have enough message for the full header, save it to the buffer and leave
        lastBuffer = data;
      }
    } else {
      clientStream.write((fixCarriageReturns) ?
        data.toString().replace(/\r?\n/g, '\r\n') : data.toString());
    }
  });
};