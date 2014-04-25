/*globals fdom:true */
/*jslint indent:2, white:true, node:true, sloppy:true, browser:true */
if (typeof fdom === 'undefined') {
  fdom = {};
}
fdom.port = fdom.port || {};

/**
 * A freedom port for a user-accessable provider.
 * @class Provider
 * @extends Port
 * @uses handleEvents
 * @param {Object} def The interface of the provider.
 * @contructor
 */
fdom.port.Provider = function(def) {
  this.id = fdom.port.Proxy.nextId();
  fdom.util.handleEvents(this);
  
  this.definition = def;
  this.mode = fdom.port.Provider.mode.synchronous;
  this.channels = {};
  this.iface = null;
  this.providerCls = null;
  this.providerInstances = {};
};

/**
 * Provider modes of operation.
 * @property mode
 * @static
 * @type number
 */
fdom.port.Provider.mode = {
  synchronous: 0,
  asynchronous: 1,
  promises: 2
};

/**
 * Receive external messages for the provider.
 * @method onMessage
 * @param {String} source the source identifier of the message.
 * @param {Object} message The received message.
 */
fdom.port.Provider.prototype.onMessage = function(source, message) {
  if (source === 'control' && message.reverse) {
    this.channels[message.name] = message.channel;
    this.emit(message.channel, {
      type: 'channel announcement',
      channel: message.reverse
    });
    this.emit('start');
  } else if (source === 'control' && message.type === 'setup') {
    this.controlChannel = message.channel;
  } else if (source === 'control' && message.type === 'close') {
    if (message.channel === this.controlChannel) {
      delete this.controlChannel;
    }
    this.close();
  } else {
    if (!this.channels[source] && message.channel) {
      this.channels[source] = message.channel;
      this.emit('start');
      return;
    } else if(!this.channels[source]) {
      fdom.debug.warn('Message from unconfigured source: ' + source);
      return;
    }

    if (message.type === 'close' && message.to) {
      delete this.providerInstances[source][message.to];
    } else if (message.to && this.providerInstances[source] &&
               this.providerInstances[source][message.to]) {
      message.message.to = message.to;
      this.providerInstances[source][message.to](message.message);
    } else if (message.to && message.message &&
        message.message.type === 'construct') {
      var args = fdom.proxy.portableToMessage(
          this.definition.constructor ? this.definition.constructor.value : [],
          message.message);
      if (!this.providerInstances[source]) {
        this.providerInstances[source] = {};
      }
      this.providerInstances[source][message.to] = this.getProvider(source, message.to, args);
    } else {
      fdom.debug.warn(this.toString() + ' dropping message ' +
          JSON.stringify(message));
    }
  }
};

/**
 * Close / teardown the flow this provider terminates.
 * @method close
 */
fdom.port.Provider.prototype.close = function() {
  if (this.controlChannel) {
    this.emit(this.controlChannel, {
      type: 'Provider Closing',
      request: 'close'
    });
    delete this.controlChannel;
  }
  this.emit('close');

  this.providerInstances = {};
  this.emitChannel = null;
};

/**
 * Get an interface to expose externally representing this port.
 * Providers are registered with the port using either
 * provideSynchronous or provideAsynchronous depending on the desired
 * return interface.
 * @method getInterface
 * @return {Object} The external interface of this Provider.
 */
fdom.port.Provider.prototype.getInterface = function() {
  if (this.iface) {
    return this.iface;
  } else {
    this.iface = {
      provideSynchronous: function(prov) {
        this.providerCls = prov;
        this.mode = fdom.port.Provider.mode.synchronous;
      }.bind(this),
      provideAsynchronous: function(prov) {
        this.providerCls = prov;
        this.mode = fdom.port.Provider.mode.asynchronous;
      }.bind(this),
      providePromises: function(prov) {
        this.providerCls = prov;
        this.mode = fdom.port.Provider.mode.promises;
      }.bind(this),
      close: function() {
        this.close();
      }.bind(this)
    };

    fdom.util.eachProp(this.definition, function(prop, name) {
      switch(prop.type) {
      case "constant":
        Object.defineProperty(this.iface, name, {
          value: fdom.proxy.recursiveFreezeObject(prop.value),
          writable: false
        });
        break;
      }
    }.bind(this));

    return this.iface;
  }
};

/**
 * Create a function that can be used to get interfaces from this provider from
 * a user-visible point.
 * @method getProxyInterface
 */
fdom.port.Provider.prototype.getProxyInterface = function() {
  var func = function(p) {
    return p.getInterface();
  }.bind({}, this);

  func.close = function(iface) {
    if (iface) {
      fdom.util.eachProp(this.ifaces, function(candidate, id) {
        if (candidate === iface) {
          this.teardown(id);
          this.emit(this.emitChannel, {
            type: 'close',
            to: id
          });
          return true;
        }
      }.bind(this));
    } else {
      // Close the channel.
      this.close();
    }
  }.bind(this);

  func.onClose = function(iface, handler) {
    if (typeof iface === 'function' && handler === undefined) {
      // Add an on-channel-closed handler.
      this.once('close', iface);
      return;
    }

    fdom.util.eachProp(this.ifaces, function(candidate, id) {
      if (candidate === iface) {
        if (this.handlers[id]) {
          this.handlers[id].push(handler);
        } else {
          this.handlers[id] = [handler];
        }
        return true;
      }
    }.bind(this));
  }.bind(this);

  return func;
};

/**
 * Get a new instance of the registered provider.
 * @method getProvider
 * @param {String} source The port this instance is interactign with.
 * @param {String} identifier the messagable address for this provider.
 * @param {Array} args Constructor arguments for the provider.
 * @return {Function} A function to send messages to the provider.
 */
fdom.port.Provider.prototype.getProvider = function(source, identifier, args) {
  if (!this.providerCls) {
    fdom.debug.warn('Cannot instantiate provider, since it is not provided');
    return null;
  }

  var events = {},
      dispatchEvent,
      BoundClass,
      instance;

  fdom.util.eachProp(this.definition, function(prop, name) {
    if (prop.type === 'event') {
      events[name] = prop;
    }
  });

  dispatchEvent = function(src, ev, id, name, value) {
    if (ev[name]) {
      var streams = fdom.proxy.messageToPortable(ev[name].value, value);
      this.emit(this.channels[src], {
        type: 'message',
        to: id,
        message: {
          name: name,
          type: 'event',
          text: streams.text,
          binary: streams.binary
        }
      });
    }
  }.bind(this, source, events, identifier);

  // this is all to say: new providerCls(dispatchEvent, args[0], args[1],...)
  BoundClass = this.providerCls.bind.apply(this.providerCls,
      [this.providerCls, dispatchEvent].concat(args || []));
  instance = new BoundClass();

  return function(port, src, msg) {
    if (msg.action === 'method') {
      if (typeof this[msg.type] !== 'function') {
        fdom.debug.warn("Provider does not implement " + msg.type + "()!");
        return;
      }
      var prop = port.definition[msg.type],
          args = fdom.proxy.portableToMessage(prop.value, msg),
          ret = function(src, msg, prop, resolve, reject) {
            var streams = fdom.proxy.messageToPortable(prop.ret, resolve);
            this.emit(this.channels[src], {
              type: 'method',
              to: msg.to,
              message: {
                to: msg.to,
                type: 'method',
                reqId: msg.reqId,
                name: msg.type,
                text: streams.text,
                binary: streams.binary,
                error: reject
              }
            });
          }.bind(port, src, msg, prop);
      if (!Array.isArray(args)) {
        args = [args];
      }
      if (port.mode === fdom.port.Provider.mode.synchronous) {
        try {
          ret(this[msg.type].apply(this, args));
        } catch(e) {
          ret(undefined, e.message);
        }
      } else if (port.mode === fdom.port.Provider.mode.asynchronous) {
        this[msg.type].apply(instance, args.concat(ret));
      } else if (port.mode === fdom.port.Provider.mode.promises) {
        this[msg.type].apply(this, args).then(ret, ret.bind({}, undefined));
      }
    }
  }.bind(instance, this, source);
};

/**
 * Get a textual description of this port.
 * @method toString
 * @return {String} the description of this port.
 */
fdom.port.Provider.prototype.toString = function() {
  if (this.emitChannel) {
    return "[Provider " + this.emitChannel + "]";
  } else {
    return "[unbound Provider]";
  }
};
