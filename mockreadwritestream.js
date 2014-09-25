var events = require('events'),
  util = require('util');

var MockReadWriteStream = module.exports = function () {
};

util.inherits(MockReadWriteStream, events.EventEmitter);

['resume', 'pause', 'setEncoding', 'flush'].forEach(function (method) {
  MockReadWriteStream.prototype[method] = function () { /* Mock */ };
});

MockReadWriteStream.prototype.write = function (msg, cb) {
  this.emit('data', msg);
  if (cb) {
    cb();
  }
};

MockReadWriteStream.prototype.publish = function (msg, cb) {
  this.emit('message', msg);
  if (cb) {
    cb();
  }
};

MockReadWriteStream.prototype.end = function (msg, cb) {
  this.emit('end', msg);
  if (cb) {
    cb();
  }
};