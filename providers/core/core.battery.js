/*globals navigator*/
/*jshint node:true*/
var PromiseCompat = require('es6-promise').Promise;
var nav = navigator;

var BatteryProvider = function(cap, dispatchEvent) {
  "use strict";
  this._batteryPromise = nav && nav.getBattery ? nav.getBattery() : null;

  if (this._batteryPromise) {
    this._batteryPromise.then(function(battery) {
      this._setupListeners(battery, dispatchEvent);
    }.bind(this));
  } else {
    console.warn("Trying to use core.battery API without client support");
  }
};

BatteryProvider.prototype.isCharging = function() {
  "use strict";
  if (!this._batteryPromise) {
    return PromiseCompat.resolve(true);  // Charging / plugged in
  }
  return this._batteryPromise.then(function(battery) {
    return battery.charging;
  });
};

BatteryProvider.prototype.getChargingTime = function() {
  "use strict";
  if (!this._batteryPromise) {
    return PromiseCompat.resolve(0);  // Fully charged
  }
  return this._batteryPromise.then(function(battery) {
    return battery.chargingTime;
  });
};

BatteryProvider.prototype.getDischargingTime = function() {
  "use strict";
  if (!this._batteryPromise) {
    return PromiseCompat.resolve(Infinity);  // Currently charging
  }
  return this._batteryPromise.then(function(battery) {
    return battery.dischargingTime;
  });
};

BatteryProvider.prototype.getLevel = function() {
  "use strict";
  if (!this._batteryPromise) {
    return PromiseCompat.resolve(1.0);  // Fully charged
  }
  return this._batteryPromise.then(function(battery) {
    return battery.level;
  });
};

BatteryProvider.prototype._setupListeners = function(battery, dispatchEvent) {
  "use strict";
  var events = [
    "chargingchange",
    "chargingtimechange",
    "dischargingtimechange",
    "levelchange"
  ];
  events.forEach(function (eventName) {
    battery.addEventListener(eventName, dispatchEvent.bind(this, eventName));
  });
};

exports.name = "core.battery";
exports.provider = BatteryProvider;
exports.style = "providePromises";
exports.flags = { provider: true };
exports.setNavigator = function(impl) {
  "use strict";
  nav = impl;
};
