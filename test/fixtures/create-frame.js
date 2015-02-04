'use strict';
var randomInt = require('./random-int');

module.exports = function createFrame (payloadStr, type) {
  type = type || randomInt(2);
  var payload = new Buffer(payloadStr);
  var header  = createHeader(type, payload.length);
  var frame   = Buffer.concat([header, payload]);

  frame.header  = header;
  frame.payload = payload;

  return frame;
};

// chunk factories
function createHeader (type, size) {
  var header = new Buffer(8);
  header.writeUInt8(type, 0);
  header.writeUInt32BE(size, 4);
  return header;
}