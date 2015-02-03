var Lab = require('lab');
var lab = exports.lab = Lab.script();
var describe = lab.experiment;
var it = lab.it;
var expect = Lab.expect;
var streamCleanser = require('../app').stream();
var MockStream = require('./fixtures/mockreadwritestream');
var createStream = require('./fixtures/create-stream');
var through = require('through');
var concat = require('concat-stream');
var createFrames = require('./fixtures/create-frames');
var splitIntoParts = require('./fixtures/split-buffer-into-parts');
var randomInt = require('./fixtures/random-int');

describe('stream', function () {
  it('should clean a stream piped to through it', function (done) {
    var frames = createFrames(5);
    var chunks = [].concat(
      frames[0].header,
      frames[0].payload,
      frames[1].header,
      frames[1].payloadChunks,
      frames[2].header,
      frames[2].payloadChunks,
      frames[3].headerChunks,
      frames[3].payloadChunks,
      frames[4].headerChunks,
      frames[4].payload
    );
    var expected = frames.reduce(function (payloadStr, frame) {
      return payloadStr + frame.payload;
    }, '');
    var dockerLogsStream = through(function (data) { this.queue(data); });

    dockerLogsStream
      .pipe(streamCleanser)
      .pipe(concat(function (data) {
        expect(data).to.equal(expected);
        done();
      }));

    // write log data to stream
    chunks.forEach(function (chunk) {
      dockerLogsStream.write(chunk);
    });
    dockerLogsStream.end();

    done();
  });
  describe('split stream chunks into smallest size possible', function() {
    it('should clean a stream piped through it', function (done) {
      var frames = createFrames(5);
      var chunks = [].concat(
        splitIntoParts(frames[0].header,  frames[0].header.length),
        splitIntoParts(frames[0].payload, frames[0].payload.length),
        splitIntoParts(frames[1].header,  frames[1].header.length),
        splitIntoParts(frames[1].payload, frames[1].payload.length),
        splitIntoParts(frames[2].header,  frames[2].header.length),
        splitIntoParts(frames[2].payload, frames[2].payload.length),
        splitIntoParts(frames[3].header,  frames[3].header.length),
        splitIntoParts(frames[3].header,  frames[3].header.length),
        splitIntoParts(frames[4].payload, frames[4].payload.length),
        splitIntoParts(frames[4].payload, frames[4].payload.length)
      );
      var expected = frames.reduce(function (payloadStr, frame) {
        return payloadStr + frame.payload;
      }, '');
      var dockerLogsStream = through(function (data) { this.queue(data); });

      dockerLogsStream
        .pipe(streamCleanser)
        .pipe(concat(function (data) {
          expect(data).to.equal(expected);
          done();
        }));

      // write log data to stream
      chunks.forEach(function (chunk) {
        dockerLogsStream.write(chunk);
      });
      dockerLogsStream.end();

      done();
    });
  });
});