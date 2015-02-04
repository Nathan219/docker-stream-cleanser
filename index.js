'use strict';
var through = require('through');

/**
 * exports createCleanserStream a duplex stream factory method
 * @type {function}
 */
module.exports = createCleanserStream;

/**
 * Create a cleanser duplex stream
 * @param  {string}       encoding stream data encoding
 * @return {DuplexStream} pipe docker stream data through this duplex stream to remove headers
 */
function createCleanserStream (encoding) {
  encoding = encoding || 'utf8'; // utf8 is buffer default
  var buffer = new Buffer('', encoding);
  var currentType;
  var bytesLeft;
  var errored;

  function write (data) {
    var self = this;
    data = Buffer.isBuffer(data) ? data : new Buffer(data, encoding);
    buffer = Buffer.concat([buffer, data]);
    checkBuffer();
    function checkBuffer () {
      if (bytesLeft) {
        sendPayloadData();
      }
      else {
        checkForHeader();
      }
    }
    function checkForHeader () {
      if (buffer.length >= 8) {
        // starting a new header and payload
        var header  = bufferSplice(0, 8);
        currentType = header.readUInt8(0);
        bytesLeft   = header.readUInt32BE(4);
        if (currentType > 2) {
          errored = true;
          return self.emit('error', new Error('Recieved unexpected type in header: '+currentType));
        }
        if (bytesLeft === 0) { // this reset is not necessary, but it is more explicit
          currentType = null;
          bytesLeft   = null;
        }
        // if there is data leftover it could be a payload or header (if payload is empty)
        if (buffer.length) {
          checkBuffer();
        }
      }
    }
    function sendPayloadData () {
      // we have data to send
      var spliceSize   = Math.min(buffer.length, bytesLeft);
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
    if (errored) { return; }
    if (buffer.length) {
      this.emit('error', new Error('End event recieved but buffer still has data'));
    }
    else {
      this.emit('end');
    }
  }
  function bufferSplice (start, end) {
    var out = buffer.slice(start, end);
    buffer = Buffer.concat([
      buffer.slice(0, start),
      buffer.slice(end, buffer.length)
    ]);
    return out;
  }

  return through(write, end);
}