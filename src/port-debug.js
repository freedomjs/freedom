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
  handleEvents(this);
};

fdom.port.Debug.prototype.toString = function() {
  return '[Console]';
};

fdom.port.Debug.prototype.onMessage = function(source, message) {
  console.log(message);
  if (source === 'control' && message.reverse && !this.emitChannel) {
    this.emitChannel = message.reverse;
  }
};

fdom.port.Debug.prototype.log = function() {
  this.emit(this.emitChannel, {severity: 'log', args: JSON.stringify(arguments)});
};

fdom.port.Debug.prototype.warn = function() {
  this.emit(this.emitChannel, {severity: 'warn', args: JSON.stringify(arguments)});
};

fdom.port.Debug.prototype.error = function() {
  this.emit(this.emitChannel, {severity: 'error', args: JSON.stringify(arguments)});
};
