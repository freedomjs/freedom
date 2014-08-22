var Logger = function (dispatch) {
  this.dispatchEvent = dispatch;
  this.queue = [];
};

Logger.prototype.log = function (msg) {
  this.queue.push([(new Date()).valueOf(), msg]);
  return Promise.resolve(true);
};

Logger.prototype.getLog = function () {
  return Promise.resolve(JSON.stringify(this.queue));
};

/** REGISTER PROVIDER **/
if (typeof freedom !== 'undefined') {
  freedom().providePromises(Logger);
}
