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
 * to the output stream.  Since this method is for real-time streaming
 * @param buildStream input stream
 * @param clientStream output stream
 * @param encoding encoding of the stream
 * @param fixCarriageReturns replaces all of the extra carriage returns with only one
 */
module.exports.cleanStreams = function (buildStream, clientStream, encoding, fixCarriageReturns) {
  buildStream.on('data', function(data) {
    if (!Buffer.isBuffer(data)) {
      data = new Buffer(data, encoding);
    }
    var header = null, pointer = 0;
    if (!data || data.length < 8 || data[1] !== 0) {
      clientStream.write((fixCarriageReturns) ?
        data.toString().replace(/\r?\n/g, '\r\n') : data.toString());
    } else {
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
        clientStream.write(payload);
      }
    }
  });
};