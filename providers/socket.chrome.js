/**
 * A FreeDOM interface to Chrome sockets
 * TODO(willscott): Refactor into freedom-chrome.
 * @constructor
 * @private
 */
var Socket_chrome = function(channel) {
  this.appChannel = channel;
  this.sid = null;
  if (chrome && chrome.socket) {
    this.create = chrome.socket.create;
    this.connect = chrome.socket.connect;
    this.read = chrome.socket.read;
    this.write = chrome.socket.write;
  }
  handleEvents(this);
};

Socket_chrome.prototype.create = function(type, options, continuation) {
  continuation({});
};

Socket_chrome.prototype.destroy = function(socketId, continuation) {
  if (chrome && chrome.socket) {
    chrome.socket.destroy(socketId);
  }
  continuation();
};

Socket_chrome.prototype.connect = function(socketId, hostname, port, continuation) {
  continuation({});
};

Socket_chrome.prototype.disconnect = function(socketId, continuation) {
  if (chrome && chrome.socket) {
    chrome.socket.disconnect(socketId);
  }
  continuation();
};

Socket_chrome.prototype.read = function(socketId, bufferSize, continuation) {
  continuation({});
};

Socket_chrome.prototype.write = function(socketId, data, continuation) {
  continuation({});
};


fdom.apis.register("core.socket", Socket_chrome);
