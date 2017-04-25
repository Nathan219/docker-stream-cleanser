'use strict'

var Code = require('code')
var Lab = require('lab')
var lab = exports.lab = Lab.script()

var describe = lab.describe
var it = lab.it
var beforeEach = lab.beforeEach
var expect = Code.expect
var through = require('through')

var Transformer = require('../transform')
var concat = require('concat-stream')
var createFrame = require('./fixtures/create-frame')

describe('stream', function () {
  var ctx
  beforeEach(function (done) {
    ctx = {}
    done()
  })

  describe('all combinations of chunks', function () {
    beforeEach(function (done) {
      var frame1 = createFrame('helloworld')
      var frame2 = createFrame('foobarbaz')
      var twoFrames = Buffer.concat([ frame1, frame2 ])
      var chunks = []
      var expected = new Buffer(0)

      for (var i = 0; i < twoFrames.length; i++) {
        chunks.push(twoFrames.slice(0, i))
        chunks.push(twoFrames.slice(i, twoFrames.length))
        expected = Buffer.concat([ expected, frame1.payload, frame2.payload ])
      }

      ctx.chunks = chunks
      ctx.expected = expected
      done()
    })

    describe('as buffers', function () {
      it('should clean a stream piped to through it', function (done) {
        assertStreamIsCleaned(done)
      })
    })

    describe('as strings (payloads only)', function () {
      beforeEach(function (done) {
        ctx.chunks = ctx.chunks.map(function (chunk) {
          return chunk.toString('base64')
        })
        ctx.expected = ctx.expected.toString()
        done()
      })
      it('should clean a stream piped to through it', function (done) {
        assertStreamIsCleaned(done)
      })
    })

    describe('as buffers and strings (mixed)', function () {
      beforeEach(function (done) {
        ctx.chunks = ctx.chunks.map(function (chunk, i) {
          return i % 2 ?
            chunk.toString('hex') :
            chunk
        })
        done()
      })
      it('should clean a stream piped to through it', function (done) {
        assertStreamIsCleaned(done)
      })
    })
  })

  describe('smallest chunks', function () {
    beforeEach(function (done) {
      var frame = createFrame('helloworld')
      var chunks = []
      var expected = frame.payload

      for (var i = 0; i < frame.length; i++) {
        chunks.push(frame.slice(i, i + 1))
      }

      ctx.chunks = chunks
      ctx.expected = expected
      done()
    })

    it('should clean a stream piped to through it', function (done) {
      assertStreamIsCleaned(done)
    })
  })

  describe('multiframe chunks', function () {
    beforeEach(function (done) {
      var frame = createFrame('helloworld')
      var chunks = []
      var expected = new Buffer(0)

      for (var i = 1; i < 3; i++) {
        var chunk = new Buffer(0)
        for (var j = 0; i < j; j++) {
          chunk = Buffer.concat([ chunk, frame ])
          expected = Buffer.concat([ expected, frame.payload ])
        }
        chunks.push(chunk)
      }

      ctx.chunks = chunks
      ctx.expected = expected
      done()
    })

    it('should clean a stream piped to through it', function (done) {
      assertStreamIsCleaned(done)
    })
  })

  function assertStreamIsCleaned (done) {
    var sourcePipe = new through()

    var transformer = new Transformer()
    // console.log(ctx.chunks)
    sourcePipe
      .pipe(transformer)
      .pipe(concat(function (data) {
        var count = 0
        const INC = 50
        data = data.toString()
        var expected = ctx.expected.toString()
        while (count < data.length) {
          var nowD = data.substr(count, INC)
          var nowE = expected.substr(count, INC)
          console.log('Count at   ', count)
          console.log('data ', nowD)
          console.log('expected ', nowE)
          count += INC
          expect(nowD).to.equal(nowE)

        }
        done()
      }))

    // write log data to stream
    ctx.chunks.forEach(function (chunk) {
      sourcePipe.write(chunk)
    })
    sourcePipe.end()
  }
})
