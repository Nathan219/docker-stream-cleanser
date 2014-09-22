var Lab = require('lab');
var lab = exports.lab = Lab.script();
var describe = lab.experiment;
var it = lab.it;
var expect = Lab.expect;
var tester = require('./app');

describe('Testing the cleanser', function() {
  it('should allow data of 1 byte to flow through without failure', function(done) {
    var data = 'h';
    var dataWithHeader = createStream(data);
    var cleansed = tester(dataWithHeader);
    expect(data).to.equal(cleansed.toString());
    done();
  });

  it('should allow data without the header to flow through without failure', function(done) {
    var data = 'hadsfasdfadsfasdfasdf';
    var dataWithHeader = createStream(data);
    var cleansed = tester(dataWithHeader);
    expect(data).to.equal(cleansed.toString());
    done();

  });

  it('should clean the header from 1 message in the stream', function(done) {
    var data = 'h';
    var dataWithHeader = createStream(data, true);
    var cleansed = tester(dataWithHeader);
    expect(data).to.equal(cleansed.toString());
    done();
  });

  it('should clean the header from multiple messages in the stream', function(done) {
    var data = [];
    var dataWithHeader = [];
    for (var x = 0; x < 10; x ++) {
      var temp = 'asdfasdf' + x;
      data.push(temp);
      dataWithHeader.push(createStream(temp));
    }
    var cleansed = tester(dataWithHeader.join(''));
    expect(data.join('')).to.equal(cleansed.toString());
    done();

  });

  it('should clean the header from a huge message in the stream', function(done) {
    var data = 'h';
    for (var x = 0; x < 500; x ++) {
      data += 'f';
    }
    var dataWithHeader = createStream(data, true);
    var cleansed = tester(dataWithHeader);
    expect(data).to.equal(cleansed.toString());
    done();

  });
});

function createStream(data, includeHeader) {
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
}
