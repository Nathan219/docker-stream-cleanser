
// Right now, we're just going to strip the headers that Docker sends.  If we ever want a way
// to color certain input, don't chop off the first byte
// 8 (unicode) bytes at the beginning of each output

module.exports = function(data) {
  var fixedData = (data.length > 1 && data[1] === 0) ? '' : data;

  while (data.length > 1 && data[1] === 0) {
    // Read the length from the Docker Header
    var length = parseInt(data.slice(4, 8).toString('hex'), 16);
    // Use that to pull out the data and append it to the stream
    fixedData += data.slice(8, 8 + length).toString();
    data = data.slice(8 + length);
  }
  return fixedData;
};
