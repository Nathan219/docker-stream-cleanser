module.exports = function createStream(data, includeHeader) {
  var length = data.length + ((includeHeader) ? 8 : 0);
  var buffer = new Buffer(length);
  if (includeHeader) {
    buffer[0] = 0x01;
    buffer[1] = 0;
    buffer[2] = 0;
    buffer[3] = 0;
    // Clear the size bytes
    buffer[4] = 0;
    buffer[5] = 0;
    buffer[6] = 0;
    buffer[7] = 0;
    // Add the data at the
    buffer.write(data, 8);
    buffer.writeInt32BE(data.length, 4);

  } else {
    buffer.write(data);
  }
  return buffer;
};