/*globals fdom:true, handleEvents, mixin, isAppContext, Worker */
/*jslint indent:2, white:true, node:true, sloppy:true, browser:true */
if (typeof fdom === 'undefined') {
  fdom = {};
}
fdom.port = fdom.port || {};

/**
 * A freedom endpoint emulating the console.
 * @uses handleEvents
 * @constructor
 */
fdom.port.Debug = function() {
  this.id = 'debug';
  this.emitChannel = false;
  this.console = null;
  handleEvents(this);
};

fdom.port.Debug.prototype.toString = function() {
  return '[Console]';
};

fdom.port.Debug.prototype.onMessage = function(source, message) {
  if (source === 'control' && message.channel && !this.emitChannel) {
    this.emitChannel = message.channel;
    this.console = message.config.global.console;
  }
};

fdom.port.Debug.prototype.format = function(severity, source, args) {
  this.emit(this.emitChannel, {
    severity: severity,
    source: source,
    quiet: true,
    request: 'debug',
    msg: args
  });
};

fdom.port.Debug.prototype.print = function(message) {
  if (typeof console !== 'undefined' && console !== this) {
    var args = JSON.parse(message.msg), arr = [], i = 0;
    while (args[i] !== undefined) {
      arr.push(args[i]);
      i += 1;
    }
    if (message.source) {
      arr.unshift('color: red');
      arr.unshift('%c ' + message.source);
    }
    console[message.severity].apply(console, arr);
  }
};

fdom.port.Debug.prototype.log = function() {
  this.format('log', undefined, JSON.stringify(arguments));
};

fdom.port.Debug.prototype.warn = function() {
  this.format('warn', undefined, JSON.stringify(arguments));
};

fdom.port.Debug.prototype.error = function() {
  this.format('error', undefined, JSON.stringify(arguments));
};
