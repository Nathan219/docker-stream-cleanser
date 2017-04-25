'use strict';
var stream = require('stream');
var async = require('async');
const HEADER_LENGTH = 8

class Cleanser extends stream.Transform {
  constructor(options) {
    super(options);
  }
  cleanse (chunk, enc, cb) {
    if (!chunk || !chunk.length) {
      return cb();
    }
    let header = 0
    let endOfData = 0

    async.whilst(
      () => {
        if (chunk.length <= HEADER_LENGTH) {
          return false
        }
        header = chunk.slice(0, HEADER_LENGTH)
        endOfData = HEADER_LENGTH + header.readUInt32BE(4)
        return chunk.length >= endOfData
      },
      whilstCb => {
        const content = chunk.slice(HEADER_LENGTH, endOfData)
        this.push(content, enc)
        // move chunk along itself
        chunk = chunk.slice(endOfData)

        setTimeout(whilstCb, 0)
      }, () => {
        if (chunk.length) {
          this.buffer = Buffer.from(chunk)
        }
        cb()
      })
  }
  _transform (chunk, enc, cb) {
    if (this.buffer) {
      chunk = Buffer.concat([this.buffer, chunk])
      delete this.buffer
    }
    this.cleanse(chunk, enc, cb)
  }

  _flush (cb) {
    this.cleanse(this.buffer, 'buffer', cb)
  }
}
module.exports = Cleanser
