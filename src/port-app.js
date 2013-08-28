/*globals fdom:true, handleEvents, mixin, eachProp, XMLHttpRequest, makeAbsolute */
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
 * @constructor
 */
fdom.port.App = function(manifestURL) {
  this.config = {};
  this.id = manifestURL + Math.random();
  this.manifestId = manifestURL;
  this.loadManifest();
  this.externalPortMap = {};
  this.internalPortMap = {};
  this.started = false;

  handleEvents(this);
};

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
      this.start();
    } else if (!this.port && message.channel) {
      this.externalPortMap[message.name] = message.channel;
      this.emit(message.channel, {
        type: 'default channel announcement',
        channel: message.reverse
      });
    } else {
      this.port.onMessage(flow, message);
    }
  } else if (flow.indexOf('custom') === 0) {
    if (this.internalPortMap[flow] === undefined) {
      this.port.onMessage('control', {
        request: 'link',
        type: 'Custom Binding',
        to: {id: flow.substr(6)},
        name: flow
      });
      this.externalPortMap[flow] = message.channel;
      this.internalPortMap[flow] = false;
      return;
    }
    if (!this.internalPortMap[flow]) {
      this.on('custom', this.onMessage.bind(this, flow, message));
    } else {
      this.port.onMessage(this.internalPortMap[flow], message);
    }
  } else {
    if (this.externalPortMap[flow] === false && message.channel) {
      this.externalPortMap[flow] = message.channel;
      if (this.manifest.provides && flow === 'default') {
        this.externalPortMap[this.manifest.provides[0]] = message.channel;
      }
      return;
    } else if (!this.started) {
      this.once('start', this.onMessage.bind(this, flow, message));
    } else {
//      console.log('mapping for ' + flow + ' was ' + this.internalPortMap[flow]);
      if (this.internalPortMap[flow] === false) {
        this.once('bound', this.onMessage.bind(this, flow, message));
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
    this.internalPortMap[name] = message.channel;
    this.emit('bound');
    return;
  }
  // Terminate debug redirection requested in start().
  if (name === 'control') {
    if (message.flow === 'debug' && message.message) {
      fdom.debug.format(message.message.severity,
          this.toString(),
          message.message.msg);
    } else if (message.name === 'AppInternal' && !this.appInternal) {
      this.appInternal = message.channel;
      this.port.onMessage(this.appInternal, {
        type: 'Initialization',
        id: makeAbsolute(this.manifestId),
        appId: this.id,
        manifest: this.manifest,
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
        type: 'bindChannel',
        channel: message.reverse
      });
      if (typeof message.name === 'string' &&
          message.name.indexOf('custom') === 0) {
        this.emit('custom');
      }
    }
  } else if (name === 'AppInternal' && message.type === 'ready' && !this.started) {
    this.started = true;
    this.emit('start');
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
  // Request the manifest
  var ref = new XMLHttpRequest();
  ref.addEventListener('readystatechange', function() {
    if (ref.readyState === 4 && ref.responseText) {
      var resp = {};
      try {
        resp = JSON.parse(ref.responseText);
      } catch(err) {
        console.warn("Failed to load manifest " + this.manifestId + ": " + err);
        return;
      }
      this.manifest = resp;
      this.start();
    } else if (ref.readyState === 4) {
      console.warn("Failed to load manifest " + this.manifestId + ": " + ref.status);
    }
  }.bind(this), false);
  ref.overrideMimeType('application/json');
  ref.open("GET", this.manifestId, true);
  ref.send();
};

/**
 * Request the external routes used by this application.
 * @method loadLinks
 * @private
 */
fdom.port.App.prototype.loadLinks = function() {
  var i, channels = ['default'], name, dep;
  if (this.manifest.permissions) {
    for (i = 0; i < this.manifest.permissions.length; i += 1) {
      name = this.manifest.permissions[i];
      if (channels.indexOf(name) < 0) {
        channels.push(name);
        if (name.indexOf('core.') === 0) {
          dep = new fdom.port.Provider(fdom.apis.get(name).definition);
          dep.getInterface().provideAsynchronous(fdom.apis.getCore(name, this));

          this.emit(this.controlChannel, {
            type: 'Link to ' + name,
            request: 'link',
            name: name,
            to: dep
          });
        }
      }
    }
  }
  if (this.manifest.dependencies) {
    eachProp(this.manifest.dependencies, function(url, name) {
      if (channels.indexOf(name) < 0) {
        channels.push(name);
      }
      var dep = new fdom.port.App(url);
      this.emit(this.controlChannel, {
        type: 'Link to ' + name,
        request: 'link',
        name: name,
        to: dep
      });
    }.bind(this));
  }
  // Note that messages can be synchronous, so some ports may already be bound.
  for (i = 0; i < channels.length; i += 1) {
    this.externalPortMap[channels[i]] = this.externalPortMap[channels[i]] || false;
    this.internalPortMap[channels[i]] = false;
  }
};
