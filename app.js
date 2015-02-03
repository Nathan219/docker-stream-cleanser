'use strict';
var through = require('through');
var exists = require('101/exists');
var last   = require('101/last');

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

module.exports.async = function(stream, encoding, cb) {
  if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }
  var result = [];
  parseDockerStream(
    stream,
    function (payload) {
      result.push(payload);
    },
    encoding,
    function () {
    cb(Buffer.concat(result));
  });
};

module.exports.stream = cleanserStream;

function cleanserStream (encoding) {
  encoding = encoding || 'utf8'; // utf8 is buffer default
  var buffer = new Buffer('', encoding);
  var currentType;
  var bytesLeft;
  return through(write, end);
  function write (data) {
    var self = this;
    if (exists(data)) {
      data = Buffer.isBuffer(data) ? data : new Buffer(data, encoding);
      buffer = Buffer.concat([buffer, data]);
      checkBuffer();
    }
    function checkBuffer () {
      if (bytesLeft) {
        sendPayloadData();
      }
      else {
        checkForHeader();
      }
    }
    function checkForHeader () {
      if (buffer.length > 8) {
        // starting a new header and payload
        var header  = bufferSplice(0, 8);
        currentType = header.readUInt8(0);
        bytesLeft   = header.readUInt32BE(4);
        if (bytesLeft === 0) {
          currentType = null;
          bytesLeft   = null;
        }
        // if there is data leftover it is a payload chunk
        if (buffer.length) {
          checkBuffer();
        }
      }
    }
    function sendPayloadData () {
      // we have data to send
      var spliceSize   = Math.min(buffer.length, bytesLeft);
      var bufferBeforeSplice = buffer;
      var payloadChunk = bufferSplice(0, spliceSize);
      bytesLeft -= spliceSize;
      if (bytesLeft === 0) {
        currentType = null;
        bytesLeft   = null;
      }
      self.queue(payloadChunk);
      // if there is data leftover it is a header chunk
      if (buffer.length) {
        checkForHeader();
      }
    }
  }
  function end () {
    if (buffer.length) {
      this.emit('error', new Error('End event recieved but buffer still has data'));
    }
    this.end();
  }
  function bufferSplice (start, end) {
    var out = buffer.slice(start, end);
    buffer = Buffer.concat([
      buffer.slice(0, start),
      buffer.slice(end, buffer.length)
    ]);
    return out;
  }
}

function parseDockerStream(stream, writeMethod, encoding, cb) {
  var array = [];
  var dataBuffer = null;

  function parseDataBuffer(ended) {
    // Sometimes messages get chopped up by docker, even in the header, so we need to handle this
    if (dataBuffer) {
      array.unshift(dataBuffer);
    }
    dataBuffer = Buffer.concat(array.splice(0, array.length));
    //We need to make sure that this isn't a continuation of the message before it
    if (dataBuffer.length > 8 && dataBuffer[0] <= 3) {
      // We're going to be popping each message off of the top of dataBuffer
      var header = dataBuffer.slice(0, 8);
      var size = header.readUInt32BE(4);
      // check if the size greater than the rest of the message.  If it is, slice off the
      // whole message (-8 to grab the header as well), and store it in the buffer
      if (8 + size <= dataBuffer.length) {

        // Basically do a splice here
        var payload = dataBuffer.slice(8, 8 + size);
        dataBuffer = dataBuffer.slice(8 + size);
        if (payload === null) {
          return;
        }
        writeMethod(payload);
        if (dataBuffer.length > 8) {
          // Since we've moved the data to a buffer outside of the processing, we can use a
          // timeout to schedule the next iteration.
          setTimeout(parseDataBuffer, 0, ended);
        }
      }
    }
    if (!dataBuffer.length && ended && cb) {
      cb();
    }
  }

  function streamEnd() {
    // Write it to hex so we don't corrupt anything
    stream.removeListener('data', writeData);
    stream.removeListener('end', streamEnd);
    parseDataBuffer(true);
  }
  function writeData(data) {
    // First, make sure the data is a buffer
    if (!Buffer.isBuffer(data)) {
      data= new Buffer(data, encoding);
    }
    array.push(data);

    // Now send it off to the parseData function
    parseDataBuffer();
  }
  // Subscribe to the data event here.
  stream.on('data', writeData);
  stream.on('end', streamEnd);
}

/**
 * This takes data from an input stream, strips out the payload, then writes that payload
 * to the output stream.  Since this method is for real-time streaming, I gave it a chance to buffer
 * the data in case the message was broken up by docker (which seems to happen sometimes)
 * @param logStream input stream
 * @param clientStream output stream
 * @param encoding encoding of the stream
 * @param fixCarriageReturns replaces all of the extra carriage returns with only one
 */
module.exports.cleanStreams = function (logStream, clientStream, encoding, fixCarriageReturns) {
  parseDockerStream(
    logStream,
    function(payload) {
      payload = (fixCarriageReturns) ?
        payload.toString().replace(/\r?\n/g, '\r\n') : payload.toString();
      clientStream.write(payload);
    },
    encoding);
};