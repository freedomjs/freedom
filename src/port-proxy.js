/*globals fdom:true, handleEvents, eachProp */
/*jslint indent:2, white:true, node:true, sloppy:true, browser:true */
if (typeof fdom === 'undefined') {
  fdom = {};
}
fdom.port = fdom.port || {};

/**
 * A freedom endpoint for a user-accessable port.
 * @uses handleEvents
 * @constructor
 */
fdom.port.Proxy = function(interfaceCls) {
  this.id = fdom.port.Proxy.nextId();
  this.interfaceCls = interfaceCls;
  handleEvents(this);
  
  this.emits = {};
};

fdom.port.Proxy.prototype.onMessage = function(source, message) {
  if (source === 'control' && message.reverse) {
    this.emitChannel = message.channel;
    this.emit(this.emitChannel, {
      type: 'bindChannel',
      channel: message.reverse
    });
    this.emit('start');
  } else if (source === 'default') {
    if (!this.emitChannel && message.channel) {
      this.emitChannel = message.channel;
      this.emit('start');
      return;
    }
    if (message.to) {
      if (this.emits[message.to]) {
        this.emits[message.to](message.type, message.message);
      } else {
        console.warn('Could not deliver message, no such interface.');
      }
    } else {
      eachProp(this.emits, function(iface) {
        iface(message.type, message.message);
      });
    }
  }
};

/**
 * Create a proxy.Interface associated with this proxy.
 * an interface is returned, and is passed three arguments
 * at construction: onMsg: function(binder) is allows registration
 * of a function to be called when messages for this interface arrive.
 * emit: function(msg) allows this interface to emit messages,
 * id: string is the Identifier for this interface.
 */
fdom.port.Proxy.prototype.getInterface = function() {
  var id = fdom.port.Proxy.nextId();
  return new this.interfaceCls(function(id, binder) {
    this.emits[id] = binder;
  }.bind(this, id), function(chan, msg) {
    this.emit(chan, msg);
  }.bind(this, this.emitChannel), id);
};

fdom.port.Proxy.prototype.toString = function() {
  if (this.emitChannel) {
    return "[Proxy " + this.emitChannel + "]";
  } else {
    return "[unbound Proxy]";
  }
};

fdom.port.Proxy.nextId = function() {
  if (!fdom.port.Proxy.id) {
    fdom.port.Proxy.id = 1;
  }
  return (fdom.port.Proxy.id += 1);
};
