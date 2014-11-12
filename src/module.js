/*jslint indent:2,node:true,sloppy:true */
var util = require('./util');
var Provider = require('./provider');

/**
 * The external Port face of a module on a hub.
 * @class Module
 * @extends Port
 * @param {String} manifestURL The manifest this module loads.
 * @param {String[]} creator The lineage of creation for this module.
 * @param {Policy} Policy The policy loader for dependencies.
 * @constructor
 */
var Module = function (manifestURL, manifest, creator, policy) {
  this.api = policy.api;
  this.policy = policy;
  this.resource = policy.resource;
  this.debug = policy.debug;

  this.config = {};

  this.id = manifestURL + Math.random();
  this.manifestId = manifestURL;
  this.manifest = manifest;
  this.lineage = [this.manifestId].concat(creator);

  this.quiet = this.manifest.quiet || false;

  this.externalPortMap = {};
  this.internalPortMap = {};
  this.dependantChannels = [];
  this.started = false;

  util.handleEvents(this);
};

/**
 * Receive a message for the Module.
 * @method onMessage
 * @param {String} flow The origin of the message.
 * @param {Object} message The message received.
 */
Module.prototype.onMessage = function (flow, message) {
  if (flow === 'control') {
    if (message.type === 'setup') {
      this.controlChannel = message.channel;
      util.mixin(this.config, message.config);
      this.emit(this.controlChannel, {
        type: 'Core Provider',
        request: 'core'
      });
      this.start();
      return;
    } else if (message.type === 'createLink' && message.channel) {
      this.debug.debug(this + 'got create link for ' + message.name);
      this.externalPortMap[message.name] = message.channel;
      if (this.internalPortMap[message.name] === undefined) {
        this.internalPortMap[message.name] = false;
      }
      var msg = {
        type: 'default channel announcement',
        channel: message.reverse
      };
      if (this.manifest.dependencies &&
          this.manifest.dependencies[message.name]) {
        msg.api = this.manifest.dependencies[message.name].api;
      }
      this.emit(message.channel, msg);
      return;
    } else if (message.core) {
      this.core = new message.core();
      this.emit('core', message.core);
      return;
    } else if (message.type === 'close') {
      // Closing channel.
      if (message.channel === 'control') {
        this.stop();
      }
      this.deregisterFlow(message.channel, false);
    } else {
      this.port.onMessage(flow, message);
    }
  } else {
    if ((this.externalPortMap[flow] === false ||
        !this.externalPortMap[flow]) && message.channel) {
      this.debug.debug(this + 'handling channel announcement for ' + flow);
      this.externalPortMap[flow] = message.channel;
      if (this.internalPortMap[flow] === undefined) {
        this.internalPortMap[flow] = false;

        // New incoming connection attempts should get routed to modInternal.
        if (this.manifest.provides && this.modInternal) {
          this.port.onMessage(this.modInternal, {
            type: 'Connection',
            channel: flow,
            api: message.api
          });
        } else if (this.manifest.provides) {
          this.once('modInternal', function (flow, api) {
            this.port.onMessage(this.modInternal, {
              type: 'Connection',
              channel: flow,
              api: api
            });
          }.bind(this, flow, message.api));
        // First connection retains legacy mapping as 'default'.
        } else if (!this.externalPortMap['default'] && message.channel) {
          this.externalPortMap['default'] = message.channel;
          this.once('internalChannelReady', function (flow) {
            this.internalPortMap[flow] = this.internalPortMap['default'];
          }.bind(this, flow));
        }
      }
      return;
    } else if (!this.started) {
      this.once('start', this.onMessage.bind(this, flow, message));
    } else {
      if (this.internalPortMap[flow] === false) {
        console.warn('waiting on internal channel for msg');
        this.once('internalChannelReady', this.onMessage.bind(this, flow, message));
      } else if (!this.internalPortMap[flow]) {
        this.debug.error('Unexpected message from ' + flow);
        return;
      } else {
        this.port.onMessage(this.internalPortMap[flow], message);
      }
    }
  }
};

/**
 * Clean up after a flow which is no longer used / needed.
 * @method deregisterFLow
 * @param {String} flow The flow to remove mappings for.
 * @param {Boolean} internal If the flow name is the internal identifier.
 * @returns {Boolean} Whether the flow was successfully deregistered.
 * @private
 */
Module.prototype.deregisterFlow = function (flow, internal) {
  var key,
    map = internal ? this.internalPortMap : this.externalPortMap;
  // TODO: this is inefficient, but seems less confusing than a 3rd
  // reverse lookup map.
  for (key in map) {
    if (map[key] === flow) {
      if (internal) {
        this.emit(this.controlChannel, {
          type: 'Channel Teardown',
          request: 'unlink',
          to: this.externalPortMap[key]
        });
      } else {
        this.port.onMessage('control', {
          type: 'close',
          channel: this.internalPortMap[key]
        });
      }
      delete this.externalPortMap[key];
      delete this.internalPortMap[key];

      // When there are still non-dependant channels, keep running
      for (key in this.externalPortMap) {
        if (this.externalPortMap.hasOwnProperty(key)) {
          if (this.dependantChannels.indexOf(key) < 0) {
            return true;
          }
        }
      }
      // Otherwise shut down the module.
      this.stop();
      return true;
    }
  }
  return false;
};

/**
 * Attempt to start the module once the remote freedom context
 * exists.
 * @method start
 * @private
 */
Module.prototype.start = function () {
  var Port;
  if (this.started || this.port) {
    return false;
  }
  if (this.controlChannel) {
    this.loadLinks();
    Port = this.config.portType;
    this.port = new Port(this.manifest.name, this.resource);
    // Listen to all port messages.
    this.port.on(this.emitMessage.bind(this));
    this.port.addErrorHandler(function (err) {
      this.debug.warn('Module Failed', err);
      this.stop();
    }.bind(this));
    // Tell the local port to ask us for help.
    this.port.onMessage('control', {
      channel: 'control',
      config: this.config
    });

    // Tell the remote location to delegate debugging.
    this.port.onMessage('control', {
      type: 'Redirect',
      request: 'delegate',
      flow: 'debug'
    });
    this.port.onMessage('control', {
      type: 'Redirect',
      request: 'delegate',
      flow: 'core'
    });
    
    // Tell the container to instantiate the counterpart to this external view.
    this.port.onMessage('control', {
      type: 'Environment Configuration',
      request: 'environment',
      name: 'ModInternal'
    });
  }
};

/**
 * Stop the module when it is no longer needed, and tear-down state.
 * @method stop
 * @private
 */
Module.prototype.stop = function () {
  if (!this.started) {
    return;
  }
  this.emit('close');
  if (this.port) {
    this.port.off();
    this.port.onMessage('control', {
      type: 'close',
      channel: 'control'
    });
    this.port.stop();
    delete this.port;
  }
  this.started = false;
};

/**
 * Textual Description of the Port
 * @method toString
 * @return {String} The description of this Port.
 */
Module.prototype.toString = function () {
  return "[Module " + this.manifest.name + "]";
};

/**
 * Intercept messages as they arrive from the module,
 * mapping them between internal and external flow names.
 * @method emitMessage
 * @param {String} name The destination the module wants to send to.
 * @param {Object} message The message to send.
 * @private
 */
Module.prototype.emitMessage = function (name, message) {
  if (this.internalPortMap[name] === false && message.channel) {
    this.internalPortMap[name] = message.channel;
    this.emit('internalChannelReady');
    return;
  }
  // Terminate debug redirection requested in start().
  if (name === 'control') {
    if (message.flow === 'debug' && message.message) {
      this.debug.format(message.message.severity,
          message.message.source || this.toString(),
          message.message.msg);
    } else if (message.flow === 'core' && message.message) {
      if (!this.core) {
        this.once('core', this.emitMessage.bind(this, name, message));
        return;
      }
      if (message.message.type === 'register') {
        message.message.reply = this.port.onMessage.bind(this.port, 'control');
        this.externalPortMap[message.message.id] = false;
      }
      this.core.onMessage(this, message.message);
    } else if (message.name === 'ModInternal' && !this.modInternal) {
      this.modInternal = message.channel;
      this.port.onMessage(this.modInternal, {
        type: 'Initialization',
        id: this.manifestId,
        appId: this.id,
        manifest: this.manifest,
        lineage: this.lineage,
        channel: message.reverse
      });
      this.emit('modInternal');
    } else if (message.type === 'createLink') {
      this.internalPortMap[message.name] = message.channel;
      this.port.onMessage(message.channel, {
        type: 'channel announcement',
        channel: message.reverse
      });
      this.emit('internalChannelReady');
    } else if (message.type === 'close') {
      this.deregisterFlow(message.channel, true);
    }
  } else if (name === 'ModInternal' && message.type === 'ready' && !this.started) {
    this.started = true;
    this.emit('start');
  } else if (name === 'ModInternal' && message.type === 'resolve') {
    this.resource.get(this.manifestId, message.data).then(function (id, data) {
      this.port.onMessage(this.modInternal, {
        type: 'resolve response',
        id: id,
        data: data
      });
    }.bind(this, message.id), function () {
      this.debug.warn('Error Resolving URL for Module.');
    }.bind(this));
  } else {
    this.emit(this.externalPortMap[name], message);
  }
  return false;
};

/**
 * Request the external routes used by this module.
 * @method loadLinks
 * @private
 */
Module.prototype.loadLinks = function () {
  var i, channels = ['default'], name, dep,
    finishLink = function (dep, name, provider) {
      var style = this.api.getInterfaceStyle(name);
      dep.getInterface()[style](provider);
    };
  if (this.manifest.permissions) {
    for (i = 0; i < this.manifest.permissions.length; i += 1) {
      name = this.manifest.permissions[i];
      if (channels.indexOf(name) < 0 && name.indexOf('core.') === 0) {
        channels.push(name);
        this.dependantChannels.push(name);
        dep = new Provider(this.api.get(name).definition, this.debug);
        this.api.getCore(name, this).then(finishLink.bind(this, dep, name));

        this.emit(this.controlChannel, {
          type: 'Core Link to ' + name,
          request: 'link',
          name: name,
          to: dep
        });
      }
    }
  }
  if (this.manifest.dependencies) {
    util.eachProp(this.manifest.dependencies, function (desc, name) {
      if (channels.indexOf(name) < 0) {
        channels.push(name);
        this.dependantChannels.push(name);
      }
      this.resource.get(this.manifestId, desc.url).then(function (url) {
        this.policy.get(this.lineage, url).then(function (dep) {
          this.updateEnv(name, dep.manifest);
          this.emit(this.controlChannel, {
            type: 'Link to ' + name,
            request: 'link',
            name: name,
            overrideDest: name + '.' + this.id,
            to: dep
          });
        }.bind(this), function (err) {
          this.debug.warn('failed to load dep: ', name, err);
        }.bind(this));
      }.bind(this));
    }.bind(this));
  }
  // Note that messages can be synchronous, so some ports may already be bound.
  for (i = 0; i < channels.length; i += 1) {
    this.externalPortMap[channels[i]] = this.externalPortMap[channels[i]] || false;
    this.internalPortMap[channels[i]] = false;
  }
};

/**
 * Update the module environment with information about a dependent manifest.
 * @method updateEnv
 * @param {String} dep The dependency
 * @param {Object} manifest The manifest of the dependency
 */
Module.prototype.updateEnv = function (dep, manifest) {
  if (!manifest) {
    return;
  }
  if (!this.modInternal) {
    this.once('modInternal', this.updateEnv.bind(this, dep, manifest));
    return;
  }
  
  var metadata;

  // Decide if/what other properties should be exported.
  // Keep in sync with ModuleInternal.updateEnv
  metadata = {
    name: manifest.name,
    icon: manifest.icon,
    description: manifest.description,
    api: manifest.api
  };
  
  this.port.onMessage(this.modInternal, {
    type: 'manifest',
    name: dep,
    manifest: metadata
  });
};

module.exports = Module;
