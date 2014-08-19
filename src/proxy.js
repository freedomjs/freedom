/*globals Blob, ArrayBuffer, DataView */
/*jslint indent:2, white:true, node:true, sloppy:true */
var debug = require('debug');
var util = require('util');

/**
 * A freedom port for a user-accessable proxy.
 * @class Proxy
 * @implements Port
 * @uses handleEvents
 * @param {Object} interfaceCls The proxy interface exposed by this proxy.
 * @constructor
 */
var Proxy = function(interfaceCls) {
  this.id = Proxy.nextId();
  this.interfaceCls = interfaceCls;
  util.handleEvents(this);
  
  this.ifaces = {};
  this.closeHandlers = {};
  this.errorHandlers = {};
  this.emits = {};
};

/**
 * Receive incoming messages for this proxy.
 * @method onMessage
 * @param {String} source The source of the message.
 * @param {Object} message The received message.
 */
Proxy.prototype.onMessage = function(source, message) {
  if (source === 'control' && message.reverse) {
    this.emitChannel = message.channel;
    this.emit(this.emitChannel, {
      type: 'channel announcement',
      channel: message.reverse
    });
    this.emit('start');
  } else if (source === 'control' && message.type === 'setup') {
    this.controlChannel = message.channel;
  } else if (source === 'control' && message.type === 'close') {
    delete this.controlChannel;
    this.doClose();
  } else {
    if (!this.emitChannel && message.channel) {
      this.emitChannel = message.channel;
      this.emit('start');
      return;
    }
    if (message.type === 'close' && message.to) {
      this.teardown(message.to);
      return;
    }
    if (message.type === 'error') {
      this.error(message.to, message.message);
      return;
    }
    if (message.to) {
      if (this.emits[message.to]) {
        this.emits[message.to]('message', message.message);
      } else {
        debug.warn('Could not deliver message, no such interface: ' + message.to);
      }
    } else {
      var msg = message.message;
      util.eachProp(this.emits, function(iface) {
        iface('message', message.message);
      });
    }
  }
};

/**
 * Create a proxy.Interface associated with this proxy.
 * An interface is returned, which is supplied with important control of the
 * proxy via constructor arguments: (bound below in getInterfaceConstructor)
 * 
 * onMsg: function(binder) sets the function to call when messages for this
 *    interface arrive on the channel,
 * emit: function(msg) allows this interface to emit messages,
 * id: string is the Identifier for this interface.
 * @method getInterface
 */
Proxy.prototype.getInterface = function() {
  var Iface = this.getInterfaceConstructor(),
      args = Array.prototype.slice.call(arguments, 0);
  if (args.length) {
    Iface = Iface.bind.apply(Iface, [Iface].concat(args));
  }
  return new Iface();
};

/**
 * Create a function that can be used to get interfaces from this proxy from
 * a user-visible point.
 * @method getProxyInterface
 */
Proxy.prototype.getProxyInterface = function() {
  var func = function(p) {
    var args = Array.prototype.slice.call(arguments, 1);
    if (args.length > 0) {
      return p.getInterface.apply(p, args);
    } else {
      return p.getInterface();
    }
  }.bind({}, this);

  func.close = function(iface) {
    if (iface) {
      util.eachProp(this.ifaces, function(candidate, id) {
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
      this.doClose();
    }
  }.bind(this);

  func.onClose = function(iface, handler) {
    if (typeof iface === 'function' && handler === undefined) {
      // Add an on-channel-closed handler.
      this.once('close', iface);
      return;
    }

    util.eachProp(this.ifaces, function(candidate, id) {
      if (candidate === iface) {
        if (this.closeHandlers[id]) {
          this.closeHandlers[id].push(handler);
        } else {
          this.closeHandlers[id] = [handler];
        }
        return true;
      }
    }.bind(this));
  }.bind(this);

  func.onError = function(iface, handler) {
    if (typeof iface === 'function' && handler === undefined) {
      this.on('error', iface);
      return;
    }
    util.eachProp(this.ifaces, function(candidate, id) {
      if (candidate === iface) {
        if (this.errorHandlers[id]) {
          this.errorHandlers[id].push(handler);
        } else {
          this.errorHandlers[id] = [handler];
        }
        return true;
      }
    }.bind(this));
  }.bind(this);
  
  return func;
};

/**
 * Provides a bound class for creating a proxy.Interface associated
 * with this proxy. This partial level of construction can be used
 * to allow the proxy to be used as a provider for another API.
 * @method getInterfaceConstructor
 * @private
 */
Proxy.prototype.getInterfaceConstructor = function() {
  var id = Proxy.nextId();
  return this.interfaceCls.bind({}, function(id, obj, binder) {
    this.ifaces[id] = obj;
    this.emits[id] = binder;
  }.bind(this, id), this.doEmit.bind(this, id));
};

/**
 * Emit a message on the channel once setup is complete.
 * @method doEmit
 * @private
 * @param {String} to The ID of the flow sending the message.
 * @param {Object} msg The message to emit
 * @param {Boolean} all Send message to all recipients.
 */
Proxy.prototype.doEmit = function(to, msg, all) {
  if (all) {
    to = false;
  }
  if (this.emitChannel) {
    this.emit(this.emitChannel, {to: to, type:'message', message: msg});
  } else {
    this.once('start', this.doEmit.bind(this, to, msg));
  }
};

/**
 * Teardown a single interface of this proxy.
 * @method teardown
 * @param {String} id The id of the interface to tear down.
 */
Proxy.prototype.teardown = function(id) {
  delete this.emits[id];
  if (this.closeHandlers[id]) {
    util.eachProp(this.closeHandlers[id], function(prop) {
      prop();
    });
  }
  delete this.ifaces[id];
  delete this.closeHandlers[id];
  delete this.errorHandlers[id];
};

/**
 * Handle a message error reported to this proxy.
 * @method error
 * @param {String?} id The id of the interface where the error occured.
 * @param {Object} message The message which failed, if relevant.
 */
Proxy.prototype.error = function(id, message) {
  if (id && this.errorHandlers[id]) {
    util.eachProp(this.errorHandlers[id], function(prop) {
      prop(message);
    });
  } else if (!id) {
    this.emit('error', message);
  }
};


/**
 * Close / teardown the flow this proxy terminates.
 * @method doClose
 */
Proxy.prototype.doClose = function() {
  if (this.controlChannel) {
    this.emit(this.controlChannel, {
      type: 'Channel Closing',
      request: 'close'
    });
  }

  util.eachProp(this.emits, function(emit, id) {
    this.teardown(id);
  }.bind(this));

  this.emit('close');
  this.off();

  this.emitChannel = null;
};

/**
 * Get the textual description of this port.
 * @method toString
 * @return The description of this port.
 */
Proxy.prototype.toString = function() {
  if (this.emitChannel) {
    return "[Proxy " + this.emitChannel + "]";
  } else {
    return "[unbound Proxy]";
  }
};

/**
 * Get the next ID for a proxy channel.
 * @method nextId
 * @static
 * @private
 */
Proxy.nextId = function() {
  if (!Proxy.id) {
    Proxy.id = 1;
  }
  return (Proxy.id += 1);
};

/**
 * Convert a structured data structure into a message stream conforming to
 * a template and an array of binary data elements.
 * @static
 * @method messageToPortable
 * @param {Object} template The template to conform to
 * @param {Object} value The instance of the data structure to confrom
 * @return {{text: Object, binary: Array}} Separated data streams.
 */
Proxy.messageToPortable = function(template, value) {
  var externals = [],
      message = Proxy.conform(template, value, externals, true);
  return {
    text: message,
    binary: externals
  };
};

/**
 * Convert Structured Data streams into a data structure conforming to a
 * template.
 * @static
 * @method portableToMessage
 * @param {Object} template The template to conform to
 * @param {{text: Object, binary: Array}} streams The streams to conform
 * @return {Object} The data structure matching the template.
 */
Proxy.portableToMessage = function(template, streams) {
  return Proxy.conform(template, streams.text, streams.binary, false);
};

/**
 * Force a collection of values to look like the types and length of an API
 * template.
 * @static
 * @method conform
 * @param {Object} template The template to conform to
 * @param {Object} from The value to conform
 * @param {Array} externals Listing of binary elements in the template
 * @param {Boolean} Whether to to separate or combine streams.
 */
Proxy.conform = function(template, from, externals, separate) {
  /* jshint -W086 */
  if (typeof(from) === 'function') {
    //from = undefined;
    //throw "Trying to conform a function";
    return undefined;
  } else if (typeof(from) === 'undefined') {
    return undefined;
  } else if (from === null) {
    return null;
  } else if (template === undefined) {
    debug.error("Message discarded for not matching declared type!", from);
    return undefined;
  }

  switch(template) {
  case 'string':
    return String('') + from;
  case 'number':
    return Number(1) * from;
  case 'boolean':
    return Boolean(from === true);
  case 'object':
    // TODO(willscott): Allow removal if sandboxing enforces this.
    if (typeof from === 'undefined') {
      return undefined;
    } else {
      return JSON.parse(JSON.stringify(from));
    }
  case 'blob':
    if (separate) {
      if (from instanceof Blob) {
        externals.push(from);
        return externals.length - 1;
      } else {
        debug.error('conform expecting Blob, but saw ' + (typeof from));
        externals.push(new Blob([]));
        return externals.length - 1;
      }
    } else {
      return externals[from];
    }
  case 'buffer':
    if (separate) {
      externals.push(Proxy.makeArrayBuffer(from));
      return externals.length - 1;
    } else {
      return Proxy.makeArrayBuffer(externals[from]);
    }
  case 'proxy':
    return from;
  }
  var val, i;
  if (Array.isArray(template) && from !== undefined) {
    val = [];
    i = 0;
    if (template.length === 2 && template[0] === 'array') {
      //console.log("template is array, value is " + JSON.stringify(value));
      for (i = 0; i < from.length; i += 1) {
        val.push(Proxy.conform(template[1], from[i], externals,
                                    separate));
      }
    } else {
      for (i = 0; i < template.length; i += 1) {
        if (from[i] !== undefined) {
          val.push(Proxy.conform(template[i], from[i], externals,
                                      separate));
        } else {
          val.push(undefined);
        }
      }
    }
    return val;
  } else if (typeof template === 'object' && from !== undefined) {
    val = {};
    util.eachProp(template, function(prop, name) {
      if (from[name] !== undefined) {
        val[name] = Proxy.conform(prop, from[name], externals, separate);
      }
    });
    return val;
  }
  debug.error('Unknown template provided: ' + template);
};

/**
 * Make a thing into an Array Buffer
 * @static
 * @method makeArrayBuffer
 * @param {Object} thing
 * @return {ArrayBuffer} An Array Buffer
 */
Proxy.makeArrayBuffer = function(thing) {
  if (!thing) {
    return new ArrayBuffer(0);
  }

  if (thing instanceof ArrayBuffer) {
    return thing;
  } else if (thing.constructor.name === "ArrayBuffer" &&
      typeof thing.prototype === "undefined") {
    // Workaround for webkit origin ownership issue.
    // https://github.com/UWNetworksLab/freedom/issues/28
    return new DataView(thing).buffer;
  } else {
    debug.error('expecting ArrayBuffer, but saw ' +
        (typeof thing) + ': ' + JSON.stringify(thing));
    return new ArrayBuffer(0);
  }
};

/**
 * Recursively traverse a [nested] object and freeze its keys from being
 * writable. Note, the result can have new keys added to it, but existing ones
 * cannot be  overwritten. Doesn't do anything for arrays or other collections.
 *
 * @method recursiveFreezeObject
 * @static
 * @param {Object} obj - object to be frozen
 * @return {Object} obj
 **/
Proxy.recursiveFreezeObject = function(obj) {
  var k, ret = {};
  if (typeof obj !== 'object') {
    return obj;
  }
  for (k in obj) {
    if (obj.hasOwnProperty(k)) {
      Object.defineProperty(ret, k, {
        value: Proxy.recursiveFreezeObject(obj[k]),
        writable: false,
        enumerable: true
      });
    }
  }
  return ret;
};

module.exports = Proxy;
