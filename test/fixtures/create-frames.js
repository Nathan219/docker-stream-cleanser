var splitIntoParts = require('./split-buffer-into-parts');
var randomInt = require('./random-int');

module.exports = function createFrames (num) {
  var i, frames = [], type, size, header, payload;
  for (i = 0; i < num; i++) {
    type = randomInt(2);
    size = randomInt(300);
    var headerChunks  = createHeaderChunks(type, size);
    var payloadChunks = createPayloadChunks(size);
    frames.push({
      header : headerChunks.reduce(concatBuffer),
      payload: payloadChunks.reduce(concatBuffer),
      headerChunks: headerChunks,
      payloadChunks: payloadChunks
    });
  }
  return frames;
};

// chunk factories
function createHeaderChunks (type, size) {
  var header = new Buffer(8);
  header.writeUInt8(type, 0);
  header.writeUInt32BE(size, 4);
  return splitIntoParts(header);
}
function createPayloadChunks (size) {
  var payload = new Buffer(size);
  for (var i = 0; i < size; i++) {
    payload.writeUInt8(randomInt(255), i);
  }
  return splitIntoParts(payload);
}

// helpers
function concatBuffer (a, b) {
  return Buffer.concat([a, b]);
}