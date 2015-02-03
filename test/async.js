var Lab = require('lab');
var lab = exports.lab = Lab.script();
var describe = lab.experiment;
var it = lab.it;
var expect = Lab.expect;
var tester = require('../app');
var MockStream = require('./fixtures/mockreadwritestream');
var createStream = require('./fixtures/create-stream');

describe('Testing the async', function() {
  it('1 message broken in the middle of the message', function(done) {
    var data = 'h';
    for (var x = 0; x < 500; x ++) {
      data += 'f';
    }
    var dataWithHeader = createStream(data, true);

    var data2 = 'd';
    for (var x = 0; x < 100; x ++) {
      data2 += 'b';
    }
    var dataWithHeader2 = createStream(data2, true);
    var dockerStream = new MockStream();
    tester.async(dockerStream, function(result) {
      result = result.toString();

      expect(data + data2).to.equal(result);
      done();
    });
    dockerStream.write(dataWithHeader);
    dockerStream.write(dataWithHeader2);
    dockerStream.end();
  });
  it('3 separate messages, 2 messages put together, but with the first message broken in the header',
    function(done) {
      var dockerStream = new MockStream();
      var data = 'h';
      for (var x = 0; x < 100; x ++) {
        data += 'f';
      }
      var dataWithHeader = createStream(data, true);
      var data2 = 'd';
      for (var x = 0; x < 100; x ++) {
        data2 += 'b';
      }
      var dataWithHeader2 = createStream(data2, true);

      var data3 = 'e';
      for (var x = 0; x < 100; x ++) {
        data3 += 's';
      }
      var dataWithHeader3 = createStream(data3, true);

      tester.async(dockerStream, function(result) {
        result = result.toString();

        expect(data + data2 + data3).to.equal(result);
        done();
      });
      dockerStream.write(Buffer.concat([dataWithHeader,
        dataWithHeader2.slice(0, 4)]));
      dockerStream.write(Buffer.concat([dataWithHeader2.slice(4), dataWithHeader3]));
      dockerStream.end();
    });

  it('3 separate messages, 2 messages put together, but with the last message broken in the header',
    function(done) {
      var dockerStream = new MockStream();
      var data = 'h';
      for (var x = 0; x < 100; x ++) {
        data += 'f';
      }
      var dataWithHeader = createStream(data, true);
      var data2 = 'd';
      for (var x = 0; x < 100; x ++) {
        data2 += 'b';
      }
      var dataWithHeader2 = createStream(data2, true);

      var data3 = 'e';
      for (var x = 0; x < 100; x ++) {
        data3 += 's';
      }
      var dataWithHeader3 = createStream(data3, true);

      tester.async(dockerStream, function(result) {
        result = result.toString();

        expect(data + data2 + data3).to.equal(result);
        done();
      });
      dockerStream.write(Buffer.concat([dataWithHeader, dataWithHeader2,
        dataWithHeader3.slice(0, 4)]));
      dockerStream.write(Buffer.concat([dataWithHeader3.slice(4)]));
      dockerStream.end();
    });
});