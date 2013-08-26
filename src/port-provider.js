/*globals fdom:true, handleEvents, eachProp */
/*jslint indent:2, white:true, node:true, sloppy:true, browser:true */
if (typeof fdom === 'undefined') {
  fdom = {};
}
fdom.port = fdom.port || {};

/**
 * A freedom endpoint for a user-accessable provider port.
 * @uses handleEvents
 * @constructor
 */
fdom.port.Provider = function(def) {
  this.id = fdom.port.Proxy.nextId();
  handleEvents(this);
  
  this.definition = def;
  this.synchronous = false;
  this.iface = null;
  this.providerCls = null;
  this.providerInstances = {};
};

fdom.port.Provider.prototype.onMessage = function(source, message) {
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
    if (message.to && this.providerInstances[message.to]) {
      this.providerInstances[message.to](message);
    } else if (message.to && message.type === 'construct') {
      this.providerInstances[message.to] = this.getProvider(message.to);
    }
  }
};

fdom.port.Provider.prototype.getInterface = function() {
  if (this.iface) {
    return this.iface;
  } else {
    this.iface = {
      provideSynchronous: function(prov) {
        this.providerCls = prov;
      }.bind(this),
      provideAsynchronous: function(prov) {
        this.providerCls = prov;
        this.synchronous = false;
      }.bind(this)
    };

    return this.iface;
  }
};

fdom.port.Provider.prototype.getProvider = function(identifier) {
  if (!this.providerCls) {
    console.warn('Cannot instantiate provider, since it is not provided');
    return null;
  }
  var instance = new this.providerCls(),
      events = {};

  eachProp(this.definition, function(prop, name) {
    if (prop.type === 'event') {
      events[name] = prop;
    }
  });
  
  instance.dispatchEvent = function(events, id, name, value) {
    if (events[name]) {
      this.emit(this.emitChannel, {
        type: 'event',
        to: id,
        message: {
          action: 'event',
          type: name,
          value: fdom.proxy.conform(events[name].value, value)
        }
      });
    }
  }.bind(this, events, identifier);

  return function(port, msg) {
    if (msg.action === 'method') {
      if (typeof this[msg.type] !== 'function') {
        console.log("Provider does not implement " + msg.type + "()!");
        return;
      }
      var args = msg.value,
          ret = function(to, req, type, ret) {
            this.emit(this.emitChannel, {
              type: 'method',
              to: to,
              message: {
                action: 'method',
                reqId: req,
                type: type,
                value: ret
              }
            });
          }.bind(port, msg.to, msg.reqId, msg.type);
      if (!Array.isArray(args)) {
        args = [args];
      }
      if (port.synchronous) {
        ret(this[msg.type].apply(this, args));
      } else {
        this[msg.type].apply(instance, args.concat(ret));
      }
    }
  }.bind(instance, this);
};

fdom.port.Provider.prototype.toString = function() {
  if (this.emitChannel) {
    return "[Provider " + this.emitChannel + "]";
  } else {
    return "[unbound Provider]";
  }
};
