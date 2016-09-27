/*globals navigator*/
/*jshint node:true*/

// This providers allows freedom modules to monitor the online status
// reported by the browser.  This is useful (1) to work around a Chromium
// bug that makes navigator.onLine always false in a Web Worker
// (https://crbug.com/114475) and (2) to provide events on status changes
// in Web Workers, which are not available otherwise due to the lack of a
// Window object.

var PromiseCompat = require('es6-promise').Promise;
// Alias navigator/window if defined, else set to false
var nav = typeof navigator !== 'undefined' && navigator;
var win = typeof window !== 'undefined' && window;

var OnlineProvider = function(cap, dispatchEvent) {
  "use strict";
  this._setupListeners(dispatchEvent);
};

OnlineProvider.prototype.isOnline = function() {
  "use strict";
  if (!nav || typeof nav.onLine === 'undefined') {
    console.warn("Trying to use core.online API without client support");
    return PromiseCompat.resolve(true);  // Connected
  }
  return PromiseCompat.resolve(nav.onLine);
};

OnlineProvider.prototype._setupListeners = function(dispatchEvent) {
  "use strict";
  if (!win || typeof win.ononline === 'undefined') {
    console.warn("Trying to use core.online events without client support");
    return;
  }

  var events = [
    "online",
    "offline"
  ];
  events.forEach(function (eventName) {
    win.addEventListener(eventName, dispatchEvent.bind(this, eventName));
  });
};

exports.name = "core.online";
exports.provider = OnlineProvider;
exports.style = "providePromises";
exports.flags = { provider: true };
exports.setMocks = function(mockNav, mockWin) {
  "use strict";
  nav = mockNav;
  win = mockWin;
};
