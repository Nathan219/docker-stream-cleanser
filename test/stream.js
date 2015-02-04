'use strict';

var Code = require('code');
var Lab = require('lab');
var lab = exports.lab = Lab.script();

var describe = lab.describe;
var it = lab.it;
var beforeEach = lab.beforeEach;
var expect = Code.expect;

var createStreamCleanser = require('../index');
var concat = require('concat-stream');
var createFrame = require('./fixtures/create-frame');

describe('stream', function () {
  var ctx;
  beforeEach(function (done) {
    ctx = {};
    done();
  });

  describe('all combinations of chunks', function () {
    beforeEach(function (done) {
      var frame1 = createFrame('helloworld');
      var frame2 = createFrame('foobarbaz');
      var twoFrames = Buffer.concat([ frame1, frame2 ]);
      var chunks = [];
      var expected = new Buffer(0);

      for (var i = 0; i < twoFrames.length; i++) {
        chunks.push(twoFrames.slice(0, i));
        chunks.push(twoFrames.slice(i, twoFrames.length));
        expected = Buffer.concat([expected, frame1.payload, frame2.payload]);
      }

      ctx.chunks   = chunks;
      ctx.expected = expected;
      ctx.streamCleanser = createStreamCleanser();
      done();
    });

    describe('as buffers', function () {
      assertStreamIsCleaned();
    });

    describe('as strings (payloads only)', function () {
      beforeEach(function (done) {
        ctx.streamCleanser = createStreamCleanser('base64');
        ctx.chunks = ctx.chunks.map(function (chunk) {
          return chunk.toString('base64');
        });
        ctx.expected = ctx.expected.toString();
        done();
      });
      assertStreamIsCleaned();
    });

    describe('as buffers and strings (mixed)', function () {
      beforeEach(function (done) {
        ctx.streamCleanser = createStreamCleanser('hex');
        ctx.chunks = ctx.chunks.map(function (chunk, i) {
          return i % 2 ?
            chunk.toString('hex') :
            chunk;
        });
        done();
      });
      assertStreamIsCleaned();
    });
  });

  describe('smallest chunks', function () {
    beforeEach(function (done) {
      var frame = createFrame('helloworld');
      var chunks = [];
      var expected = frame.payload;

      for (var i = 0; i < frame.length; i++) {
        chunks.push(frame.slice(i, i+1));
      }

      ctx.chunks   = chunks;
      ctx.expected = expected;
      ctx.streamCleanser = createStreamCleanser('utf8');
      done();
    });

    assertStreamIsCleaned();
  });

  describe('multiframe chunks', function () {
    beforeEach(function (done) {
      var frame = createFrame('helloworld');
      var chunks = [];
      var expected = new Buffer(0);

      for (var i = 1; i < 3; i++) {
        var chunk = new Buffer(0);
        for (var j = 0; i < j; j++) {
          chunk    = Buffer.concat([ chunk, frame ]);
          expected = Buffer.concat([ expected, frame.payload ]);
        }
        chunks.push(chunk);
      }

      ctx.chunks   = chunks;
      ctx.expected = expected;
      ctx.streamCleanser = createStreamCleanser('utf8');
      done();
    });

    assertStreamIsCleaned();
  });

  describe('encoding', function() {
    beforeEach(function (done) {
      var frame = createFrame('helloworld');
      ctx.chunks = [frame];
      ctx.expected = frame.payload;
      ctx.streamCleanser = createStreamCleanser('utf8');
      done();
    });

    assertStreamIsCleaned();
  });

  describe('empty payload', function() {
    beforeEach(function (done) {
      var frame = createFrame('');
      ctx.chunks = [frame];
      ctx.expected = frame.payload;
      ctx.streamCleanser = createStreamCleanser('utf8');
      done();
    });

    assertStreamIsCleaned();
  });

  describe('incomplete payload', function() {
    beforeEach(function (done) {
      var frame = createFrame('hello');
      frame = frame.slice(0, 2); // incomplete header and no more data
      ctx.chunks = [frame];
      ctx.expected = frame.payload;
      ctx.streamCleanser = createStreamCleanser('utf8');
      done();
    });
    it('should error bc it will get end before payload completes', function (done) {
      var streamCleanser = ctx.streamCleanser;
      // console.log(ctx.chunks);
      streamCleanser
        .pipe(concat(function () {
          // never makes it..
        }));

      streamCleanser.on('error', function (err) {
        expect(err).to.exist();
        expect(err.message).to.match(/buffer still has data/);
        done();
      });

      // write log data to stream
      ctx.chunks.forEach(function (chunk) {
        streamCleanser.write(chunk);
      });
      streamCleanser.end();
    });
  });

  describe('error upon recieving unexpected header type (> 2)', function() {
    beforeEach(function (done) {
      var frame = createFrame('hello', 3);
      ctx.chunks = [frame];
      ctx.expected = frame.payload;
      ctx.streamCleanser = createStreamCleanser('utf8');
      done();
    });
    it('should error bc it will get end before payload completes', function (done) {
      var streamCleanser = ctx.streamCleanser;
      // console.log(ctx.chunks);
      streamCleanser
        .pipe(concat(function () {
          // never makes it..
        }));

      streamCleanser.on('error', function (err) {
        expect(err).to.exist();
        expect(err.message).to.match(/unexpected type/);
        done();
      });

      // write log data to stream
      ctx.chunks.forEach(function (chunk) {
        streamCleanser.write(chunk);
      });
      streamCleanser.end();
    });
  });

  function assertStreamIsCleaned () {
    it('should clean a stream piped to through it', function (done) {
      var streamCleanser = ctx.streamCleanser;
      // console.log(ctx.chunks);
      streamCleanser
        .pipe(concat(function (data) {
          expect(data.toString()).to.equal(ctx.expected.toString());
          done();
        }));

      streamCleanser.on('error', done);

      // write log data to stream
      ctx.chunks.forEach(function (chunk) {
        streamCleanser.write(chunk);
      });
      streamCleanser.end();
    });
  }
});