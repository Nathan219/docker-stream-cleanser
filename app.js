
// Right now, we're just going to strip the headers that Docker sends.  If we ever want a way
// to color certain input, don't chop off the first byte
// 8 (unicode) bytes at the beginning of each output

module.exports = function(data, encoding) {
  if (!Buffer.isBuffer(data)) {
    data = new Buffer(data, encoding);
  }
  var result = '';
  var header = null, pointer = 0;
  if (!data || data.length < 8 || data[1] !== 0) { return data; }
  while(pointer < data.length) {
    header = data.slice(pointer, pointer += 8);
    if (header[1] - header[2] - header[3] !== 0) {
      break;
    }
    var size = header.readUInt32BE(4);
    var payload = data.slice(pointer, pointer += size);
    if (payload === null) break;
    result += payload.toString();
  }
  return result;
};

module.exports.cleanStreams = function (buildStream, clientStream, encoding) {
  buildStream.on('data', function(data) {
    if (!Buffer.isBuffer(data)) {
      data = new Buffer(data, encoding);
    }
    var header = null, pointer = 0;
    if (!data || data.length < 8 || data[1] !== 0) {
      clientStream.write(data.toString());
    } else {
      while(pointer < data.length) {
        header = data.slice(pointer, pointer += 8);
        if (header[1] - header[2] - header[3] !== 0) {
          break;
        }
        var size = header.readUInt32BE(4);
        var payload = data.slice(pointer, pointer += size);
        if (payload === null) break;
        clientStream.write(payload.toString());
      }
    }
  });
};