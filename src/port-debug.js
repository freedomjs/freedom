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
  handleEvents(this);
};

fdom.port.Debug.onMessage = function(source, message) {
  if (source === 'control' && message.reverse) {
    this.emitChannel = message.channel;
    this.emit(this.emitChannel, {
      channel: message.reverse
    });
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
