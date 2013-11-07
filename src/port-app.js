/*globals fdom:true, Util:true, handleEvents, mixin, eachProp */
/*jslint indent:2,white:true,node:true,sloppy:true */
if (typeof fdom === 'undefined') {
  fdom = {};
}
fdom.port = fdom.port || {};

/**
 * The external Port face of an application on a hub.
 * @class App
 * @extends Port
 * @param {String} manifestURL The manifest this module loads.
 * @param {String[]} creator The lineage of creation for this module.
 * @constructor
 */
fdom.port.App = function(manifestURL, creator) {
  this.config = {};
  this.id = manifestURL + Math.random();
  this.manifestId = manifestURL;
  this.lineage = [this.manifestId].concat(creator);
  this.loadManifest();
  this.externalPortMap = {};
  this.internalPortMap = {};
  this.started = false;

  handleEvents(this);
};

/**
 * Apps are relocatable.
 */
fdom.port.App.prototype.relocatable = true;

/**
 * Receive an external application for the Application.
 * @method onMessage
 * @param {String} flow The origin of the message.
 * @param {Object} message The message received.
 */
fdom.port.App.prototype.onMessage = function(flow, message) {
  if (flow === 'control') {
    if (!this.controlChannel && message.channel) {
      this.controlChannel = message.channel;
      mixin(this.config, message.config);
      this.emit(this.controlChannel, {
        type: 'Core Provider',
        request: 'core'
      });
      this.start();
      return;
    } else if (message.type === 'createLink' && message.channel) {
      this.externalPortMap[message.name] = message.channel;
      if (this.internalPortMap[message.name] === undefined) {
        this.internalPortMap[message.name] = false;
      }
      this.emit(message.channel, {
        type: 'default channel announcement',
        channel: message.reverse
      });
      return;
    } else if (message.core) {
      this.core = new message.core();
      this.emit('core', message.core);
      return;
    } else {
      this.port.onMessage(flow, message);
    }
  } else {
    if (this.externalPortMap[flow] === false && message.channel) {
      //console.log('handling channel announcement for ' + flow);
      this.externalPortMap[flow] = message.channel;
      if (this.internalPortMap[flow] === undefined) {
        this.internalPortMap[flow] = false;
      }
      if (this.manifest.provides && flow === 'default') {
        this.externalPortMap[this.manifest.provides[0]] = message.channel;
      }
      return;
    } else if (!this.started) {
      this.once('start', this.onMessage.bind(this, flow, message));
    } else {
      if (this.internalPortMap[flow] === false) {
        this.once('internalChannelReady', this.onMessage.bind(this, flow, message));
      } else {
        this.port.onMessage(this.internalPortMap[flow], message);
      }
    }
  }
};

/**
 * Attempt to start the applicaiton once the remote freedom context
 * exists.
 * @method start
 * @private
 */
fdom.port.App.prototype.start = function() {
  if (this.started || this.port) {
    return false;
  }
  if (this.manifest && this.controlChannel) {
    this.loadLinks();
    this.port = new fdom.port[this.config.portType](this);
    // Listen to all port messages.
    this.port.on(this.emitMessage.bind(this));
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
    
    // Tell the remote location to instantate the app.
    this.port.onMessage('control', {
      type: 'Environment Configuration',
      request: 'port',
      name: 'AppInternal',
      service: 'AppInternal',
      exposeManager: true
    });
  }
};

/**
 * Textual Description of the Port
 * @method toString
 * @return {String} The description of this Port.
 */
fdom.port.App.prototype.toString = function() {
  return "[App " + this.manifestId + "]";
};

/**
 * Intercept messages as they arrive from the application,
 * mapping them between internal and external flow names.
 * @method emitMessage
 * @param {String} name The destination the app wants to send to.
 * @param {Object} message The message to send.
 * @private
 */
fdom.port.App.prototype.emitMessage = function(name, message) {
  if (this.internalPortMap[name] === false && message.channel) {
    fdom.debug.log('bound for ' + name);
    this.internalPortMap[name] = message.channel;
    this.emit('internalChannelReady');
    return;
  }
  // Terminate debug redirection requested in start().
  if (name === 'control') {
    if (message.flow === 'debug' && message.message) {
      fdom.debug.format(message.message.severity,
          this.toString(),
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
    } else if (message.name === 'AppInternal' && !this.appInternal) {
      this.appInternal = message.channel;
      this.port.onMessage(this.appInternal, {
        type: 'Initialization',
        id: this.manifestId,
        appId: this.id,
        manifest: this.manifest,
        lineage: this.lineage,
        channel: message.reverse
      });
    } else {
      // A design decision was that the default channel is
      // overridden when acting as a provider.
      if (this.manifest.provides &&
          this.manifest.provides.indexOf(message.name) === 0) {
        this.internalPortMap['default'] = message.channel;
      }

      this.internalPortMap[message.name] = message.channel;
      this.port.onMessage(message.channel, {
        type: 'channel announcement',
        channel: message.reverse
      });
      this.emit('internalChannelReady');
    }
  } else if (name === 'AppInternal' && message.type === 'ready' && !this.started) {
    this.started = true;
    this.emit('start');
  } else if (name === 'AppInternal' && message.type === 'resolve') {
    fdom.resources.get(this.manifestId, message.data).done(function(id, data) {
      this.port.onMessage(this.appInternal, {
        type: 'resolve response',
        id: id,
        data: data
      });
    }.bind(this, message.id));
  } else {
    this.emit(this.externalPortMap[name], message);
  }
  return false;
};

/**
 * Load the module description from its manifest.
 * @method loadManifest
 * @private
 */
fdom.port.App.prototype.loadManifest = function() {
  fdom.resources.getContents(this.manifestId).done(function(data) {
    var resp = {};
    try {
      resp = JSON.parse(data);
    } catch(err) {
      fdom.debug.warn("Failed to load " + this.manifestId + ": " + err);
      return;
    }
    this.manifest = resp;
    this.start();
  }.bind(this));
};

/**
 * Request the external routes used by this application.
 * @method loadLinks
 * @private
 */
fdom.port.App.prototype.loadLinks = function() {
  var i, channels = ['default'], name, dep,
      finishLink = function(dep, provider) {
        dep.getInterface().provideAsynchronous(provider);
      };
  if (this.manifest.permissions) {
    for (i = 0; i < this.manifest.permissions.length; i += 1) {
      name = this.manifest.permissions[i];
      if (channels.indexOf(name) < 0 && name.indexOf('core.') === 0) {
        channels.push(name);
        dep = new fdom.port.Provider(fdom.apis.get(name).definition);
        fdom.apis.getCore(name, this).done(finishLink.bind(this, dep));

        this.emit(this.controlChannel, {
          type: 'Link to ' + name,
          request: 'link',
          name: name,
          to: dep
        });
      }
    }
  }
  if (this.manifest.dependencies) {
    eachProp(this.manifest.dependencies, function(desc, name) {
      if (channels.indexOf(name) < 0) {
        channels.push(name);
      }
      fdom.resources.get(this.manifestId, desc.url).done(function (url) {
        var dep = new fdom.port.App(url, this.lineage);
        this.emit(this.controlChannel, {
          type: 'Link to ' + name,
          request: 'link',
          name: name,
          to: dep
        });
      }.bind(this));
    }.bind(this));
  }
  // Note that messages can be synchronous, so some ports may already be bound.
  for (i = 0; i < channels.length; i += 1) {
    this.externalPortMap[channels[i]] = this.externalPortMap[channels[i]] || false;
    this.internalPortMap[channels[i]] = false;
  }
};

fdom.port.App.prototype.serialize = function() {
  return JSON.serialize({
    manifestId: this.manifestId,
    externalPortMap: this.externalPortMap,
    internalPortMap: this.internalPortMap,
    manifest: this.manifest,
    controlChannel: this.controlChannel
  });
};
