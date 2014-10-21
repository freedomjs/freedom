/*jslint sloppy:true*/
/*globals Promise,freedom*/
var queue = [];

// Logger for recording Logs.
var Logger = function (dispatch) {
  this.dispatchEvent = dispatch;
};

Logger.prototype.log = function (msg) {
  queue.push([(new Date()).valueOf(), 'log', msg]);
  return Promise.resolve(true);
};
Logger.prototype.debug = function (msg) {
  queue.push([(new Date()).valueOf(), 'debug', msg]);
  return Promise.resolve(true);
};
Logger.prototype.info = function (msg) {
  queue.push([(new Date()).valueOf(), 'info', msg]);
  return Promise.resolve(true);
};
Logger.prototype.warn = function (msg) {
  queue.push([(new Date()).valueOf(), 'warn', msg]);
  return Promise.resolve(true);
};
Logger.prototype.error = function (msg) {
  queue.push([(new Date()).valueOf(), 'error', msg]);
  return Promise.resolve(true);
};

// Get Log API for retreaving Logs.
var GetLogs = function () {
};

GetLogs.prototype.get = function () {
  return JSON.stringify(queue);
};

/** REGISTER PROVIDER **/
if (typeof freedom !== 'undefined') {
  freedom().providePromises(Logger);
  freedom.getLogs().provideSynchronous(GetLogs);
}
