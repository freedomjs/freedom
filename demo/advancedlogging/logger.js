/*globals freedom*/
var log = [],
  backchannel = freedom.loggingbackchannel();

var record = function (level, source, message) {
  'use strict';
  var formatted = '<span style="';
  if (level === 'debug') {
    formatted += "color:#888;";
  } else if (level === 'info') {
    formatted += "color:blue;";
  } else if (level === 'log') {
    formatted += "color:black;";
  } else if (level === 'warn') {
    formatted += "color:orange;";
  } else if (level === 'error') {
    formatted += "color:red;";
  }
  formatted += '">';
  if (!source) {
    source = '<span style="opacity:0.7;">[Freedom Internal]</span>';
  }
  formatted += source + ' <b style="padding-right:50px;">' + level + '</b>' + message + '</span>';
  if (log.dispatchEvent) {
    log.dispatchEvent('msg', formatted);
  } else {
    log.push(formatted);
  }
};

var Logger = function (dispatchEvent) {
  'use strict';
};

Logger.prototype.debug = record.bind({}, 'debug');
Logger.prototype.info = record.bind({}, 'info');
Logger.prototype.log = record.bind({}, 'log');
Logger.prototype.warn = record.bind({}, 'warn');
Logger.prototype.error = record.bind({}, 'error');

/**
 * When a backchannel is open, drain pending log messages, and register the
 * channel as the destination for subsequent messages.
 */
var BackLogger = function (dispatchEvent) {
  'use strict';
  this.dispatchEvent = dispatchEvent;

  if (!log.dispatchEvent) {
    log.forEach(function (msg) {
      this.dispatchEvent('msg', msg);
    }.bind(this));
    log = this;
  }
  //TODO: handle closing gracefully.
  /*
  backchannel.onClose(this, function () {
    log = [];
  });
  */
};

freedom().provideSynchronous(Logger);
backchannel.provideSynchronous(BackLogger);