
// Right now, we're just going to strip the headers that Docker sends.  If we ever want a way
// to color certain input, don't chop off the first byte
// 8 (unicode) bytes at the beginning of each output

module.exports = function(data) {
  if (typeof data === 'string') {
    data = new Buffer(data);
  }
  var result = '';
  var header = null;
  if (!data || data.length < 8 || data[1] !== 0) { return data; }
  for (var pointer = 0; pointer < data.length;) {
    header = data.slice(pointer, pointer += 8);
    var size = header.readUInt32BE(4);
    var payload = data.slice(pointer, pointer += size);
    if (payload === null) break;
    result += payload.toString();
  }
  return result;
};

module.exports.cleanStreams = function (buildStream, clientStream) {
  buildStream.on('data', function(data) {
    var header = null;
    if (!data || data.length < 8 || data[1] !== 0) {
      clientStream.write(data.toString());
    } else {
      for (var pointer = 0; pointer < data.length;) {
        header = data.slice(pointer, pointer += 8);
        var size = header.readUInt32BE(4);
        var payload = data.slice(pointer, pointer += size);
        if (payload === null) break;
        clientStream.write(payload.toString());
      }
    }
  });
};