/*globals fdom:true, handleEvents, mixin, isAppContext, Worker */
/*jslint indent:2, white:true, node:true, sloppy:true, browser:true */
if (typeof fdom === 'undefined') {
  fdom = {};
}
fdom.port = fdom.port || {};

/**
 * A freedom endpoint for an unconstrained, unpriveledged channel.
 * @uses handleEvents
 * @constructor
 */
fdom.port.Proxy = function(binder) {
  handleEvents(this);

  // The internal object is bound to the hub and talks to freedom.js
  // while this becomes a divorced message channel.
  var internal = {
    id: fdom.port.Proxy.nextId(),
    externalEmit: this.emit
  },
      self = this;
  handleEvents(internal);
  
  this.emit = function(internal, type, msg) {
    internal.emit(internal.emitChannel, {
      type: type,
      message: msg
    });
  }.bind(this, internal);
  
  internal.onMessage = function(source, message) {
    if (source === 'control' && message.reverse) {
      this.emitChannel = message.channel;
      this.emit(this.emitChannel, {
        type: 'bindChannel',
        channel: message.reverse
      });
    } else if (source === 'default') {
      this.externalEmit(message.type, message.message);
    }
  }.bind(internal);
  
  internal.toString = function() {
    if (this.emitChannel) {
      return "[Proxy bound to " + this.emitChannel + "]";
    } else {
      return "[unbound Proxy]";
    }
  };

  binder(internal);
};

fdom.port.Proxy.nextId = function() {
  if (!fdom.port.Proxy.id) {
    fdom.port.Proxy.id = 1;
  }
  return (fdom.port.Proxy.id += 1);
};
