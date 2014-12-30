/*jshint node:true*/
/*global */
var PromiseCompat = require('es6-promise').Promise;

var XhrProvider = function(cap, dispatchEvent) {
  "use strict";
  this._dispatchEvent = dispatchEvent;
  this._xhr = new XMLHttpRequest();

  this._events = [
    "progress",
    "load",
    "error",
    "abort",
    "timeout",
    "loadend",
    "readystatechange"
  ];
  this._setupListeners();
};

XhrProvider.prototype.open = function(method, url, async, user, password) {
  "use strict";
  this._xhr.open(method, url, async, user, password);
  return PromiseCompat.resolve();
};

XhrProvider.prototype.send = function(data) {
  "use strict";
  if (data.hasOwnProperty("string")) {
    this._xhr.send(data.string);
  } else if (data.hasOwnProperty("buffer")) {
    this._xhr.send(data.buffer);
  } else {
    this._xhr.send();
  }
  return PromiseCompat.resolve();
};

XhrProvider.prototype.abort = function() {
  "use strict";
  this._xhr.abort();
  return PromiseCompat.resolve();
};

XhrProvider.prototype.getResponseHeader = function(header) {
  "use strict";
  return PromiseCompat.resolve(this._xhr.getResponseHeader(header));
};

XhrProvider.prototype.getAllResponseHeaders = function() {
  "use strict";
  return PromiseCompat.resolve(this._xhr.getAllResponseHeaders());
};

XhrProvider.prototype.setRequestHeader = function(header, value) {
  "use strict";
  this._xhr.setRequestHeader(header, value);
  return PromiseCompat.resolve();
};

XhrProvider.prototype.overrideMimeType = function(mime) {
  "use strict";
  this._xhr.overrideMimeType(mime);
  return PromiseCompat.resolve();
};

XhrProvider.prototype.getReadyState = function() {
  "use strict";
  return PromiseCompat.resolve(this._xhr.readyState);
};

XhrProvider.prototype.getResponse = function() {
  "use strict";
  if (this._xhr.response === null) {
    return PromiseCompat.resolve(null);
  } else if (this._xhr.response instanceof String) {
    return PromiseCompat.resolve({ string: this._xhr.response });
  } else if (this._xhr.response instanceof ArrayBuffer) {
    return PromiseCompat.resolve({ buffer: this._xhr.response });
  }

  // Log issue?
  return PromiseCompat.resolve({});
};

XhrProvider.prototype.getResponseText = function() {
  "use strict";
  return PromiseCompat.resolve(this._xhr.responseText);
};

XhrProvider.prototype.getResponseType = function() {
  "use strict";
  return PromiseCompat.resolve(this._xhr.responseType);
};

XhrProvider.prototype.getStatus = function() {
  "use strict";
  return PromiseCompat.resolve(this._xhr.status);
};

XhrProvider.prototype.getStatusText = function() {
  "use strict";
  return PromiseCompat.resolve(this._xhr.statusText);
};

XhrProvider.prototype.getTimeout = function() {
  "use strict";
  return PromiseCompat.resolve(this._xhr.timeout);
};

XhrProvider.prototype.setTimeout = function(timeout) {
  "use strict";
  this._xhr.timeout = timeout;
  return PromiseCompat.resolve();
};

XhrProvider.prototype._setupListeners = function() {
  "use strict";
  this._events.forEach(function (eventName) {
    this._xhr.addEventListener(eventName, function(eventName, event) {
      this._dispatchEvent(eventName, {});
    }.bind(this, eventName), false);
  }.bind(this));
};

exports.name = "core.xhr";
exports.provider = XhrProvider;
exports.style = "providePromises";
exports.flags = { provider: true };
