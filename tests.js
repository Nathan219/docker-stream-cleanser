var Lab = require('lab');
var lab = exports.lab = Lab.script();
var describe = lab.experiment;
var it = lab.it;
var expect = Lab.expect;
var tester = require('./app');
var MockStream = require('./mockreadwritestream');

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

describe('Testing the streaming cleanser', function() {
  // Things to test
  //  normal output
  //  1 message broken in the middle of the message
  //  1 message broken in the middle of the header
  //  2 separate messages, 2 messages put together, but with the last message broken in the header
  var data = 'h';
  for (var x = 0; x < 500; x ++) {
    data += 'f';
  }
  var dataWithHeader = createStream(data, true);
  it('should clean the header from a huge message in the stream', function(done) {
    var dockerStream = new MockStream();
    var clientStream = new MockStream();
    tester.cleanStreams(dockerStream, clientStream, 'hex', false);

    clientStream.on('data', function (result) {
      expect(data).to.equal(result);
      done();
    });
    dockerStream.write(dataWithHeader.toString('hex'));
  });

  it('1 message broken in the middle of the message', function(done) {
    var dockerStream = new MockStream();
    var clientStream = new MockStream();
    tester.cleanStreams(dockerStream, clientStream, 'hex', false);

    var data2 = 'd';
    for (var x = 0; x < 100; x ++) {
      data2 += 'b';
    }
    var dataWithHeader2 = createStream(data2, true);

    var endData = false;
    clientStream.on('data', function (result) {
      if (endData) {
        expect(data2).to.equal(result);
        done();
      } else {
        endData = true;
        expect(data).to.equal(result);
      }
    });
    dockerStream.write(dataWithHeader.toString('hex') + dataWithHeader2.toString('hex'));
  });


  it('1 message broken in the middle of the message', function(done) {
    var dockerStream = new MockStream();
    var clientStream = new MockStream();
    tester.cleanStreams(dockerStream, clientStream, 'hex', false);

    var data2 = 'd';
    for (var x = 0; x < 100; x ++) {
      data2 += 'b';
    }
    var dataWithHeader2 = createStream(data2, true);

    var endData = false;
    clientStream.on('data', function (result) {
      if (endData) {
        expect(data2).to.equal(result);
        done();
      } else {
        endData = true;
        expect(data).to.equal(result);
      }
    });
    dockerStream.write(dataWithHeader.toString('hex') +
      dataWithHeader2.slice(0, 50).toString('hex'));
    dockerStream.write(dataWithHeader2.slice(50).toString('hex'));
  });

  it('1 message broken in the middle of the header', function(done) {
    var dockerStream = new MockStream();
    var clientStream = new MockStream();
    tester.cleanStreams(dockerStream, clientStream, 'hex', false);

    var data2 = 'd';
    for (var x = 0; x < 100; x ++) {
      data2 += 'b';
    }
    var dataWithHeader2 = createStream(data2, true);

    var endData = false;
    clientStream.on('data', function (result) {
      if (endData) {
        expect(data2).to.equal(result);
        done();
      } else {
        endData = true;
        expect(data).to.equal(result);
      }
    });
    dockerStream.write(dataWithHeader.toString('hex') +
      dataWithHeader2.slice(0, 1).toString('hex'));
    dockerStream.write(dataWithHeader2.slice(1).toString('hex'));
  });

  it('3 separate messages, 2 messages put together, but with the last message broken in the header',
   function(done) {
    var dockerStream = new MockStream();
    var clientStream = new MockStream();
    tester.cleanStreams(dockerStream, clientStream, 'hex', false);

    var data2 = 'd';
    for (var x = 0; x < 100; x ++) {
      data2 += 'b';
    }
    var dataWithHeader2 = createStream(data2, true);

    var data3 = 'd';
    for (var x = 0; x < 100; x ++) {
      data3 += 'b';
    }
    var dataWithHeader3 = createStream(data3, true);

    var endData = 2;
    clientStream.on('data', function (result) {
      if (! endData) {
        expect(data3).to.equal(result);
        done();
      } else if (endData === 2) {
        endData--;
        expect(data).to.equal(result);
      } else {
        endData--;
        expect(data2).to.equal(result);
      }
    });
    dockerStream.write(dataWithHeader.toString('hex') + dataWithHeader2.toString('hex') +
      dataWithHeader3.slice(0, 4).toString('hex'));
    dockerStream.write(dataWithHeader3.slice(4).toString('hex'));
  });

  it('3 separate messages, 2 messages put together, but with the first message broken in the header',
    function(done) {
      var dockerStream = new MockStream();
      var clientStream = new MockStream();
      tester.cleanStreams(dockerStream, clientStream, 'hex', false);

      var data2 = 'd';
      for (var x = 0; x < 100; x ++) {
        data2 += 'b';
      }
      var dataWithHeader2 = createStream(data2, true);

      var data3 = 'd';
      for (var x = 0; x < 100; x ++) {
        data3 += 'b';
      }
      var dataWithHeader3 = createStream(data3, true);

      var endData = 2;
      clientStream.on('data', function (result) {
        if (! endData) {
          expect(data3).to.equal(result);
          done();
        } else if (endData === 2) {
          endData--;
          expect(data).to.equal(result);
        } else {
          endData--;
          expect(data2).to.equal(result);
        }
      });
      dockerStream.write(dataWithHeader.toString('hex') +
        dataWithHeader2.slice(0, 4).toString('hex'));
      dockerStream.write(dataWithHeader2.slice(4).toString('hex') + dataWithHeader3.toString('hex'));
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
