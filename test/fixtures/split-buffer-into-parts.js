var randomInt = require('./random-int');

module.exports = function splitIntoParts (buffer, numParts) {
  var parts = [];
  var partSize = numParts ?
    Math.round(buffer.length/numParts) :
    randomInt(buffer.length);
  while (buffer.length) {
    parts.push(
      bufferSplice(0, partSize)
    );
  }
  return parts;
  function bufferSplice (start, end) {
    end = Math.min(buffer.length, end);
    var out = buffer.slice(start, end);
    buffer = Buffer.concat([
      buffer.slice(0, start),
      buffer.slice(end, buffer.length)
    ]);
    return out;
  }
};