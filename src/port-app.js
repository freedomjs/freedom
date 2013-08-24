/*globals fdom:true, handleEvents, mixin, eachProp, XMLHttpRequest */
/*jslint indent:2,white:true,node:true,sloppy:true */
if (typeof fdom === 'undefined') {
  fdom = {};
}
fdom.port = fdom.port || {};

/**
 * An agent configuring a local application to run in this scope.
 * @class Agent.Local
 * @extends Agent
 * @constructor
 */
fdom.port.App = function(manifestURL) {
  this.config = {};
  this.id = manifestURL + Math.random();
  this.manifestId = manifestURL;
  this.loadManifest();
  this.portMap = {};

  handleEvents(this);
};

fdom.port.App.prototype.onMessage = function(flow, message) {
  if (flow === 'control') {
    if (!this.controlChannel && message.channel) {
      this.controlChannel = message.channel;
      mixin(this.config, message.config);
      this.start();
    } else if (!this.port && message.channel) {
      this.portMap[message.name] = message.channel;
      this.emit(message.channel, {
        channel: message.reverse
      });
    } else {
      this.port.onMessage(flow, message);
    }
  } else {
    if (!this.started()) {
      this.once('start', this.onMessage.bind(this, flow, message));
    } else {
      this.port.onMessage(flow, message);
    }
  }
};

fdom.port.App.prototype.started = function() {
  return this.port !== undefined;
};

fdom.port.App.prototype.start = function() {
  if (this.started()) {
    return false;
  }
  if (this.manifest && this.controlChannel) {
    this.loadLinks();
    this.port = new fdom.port[this.config.portType](this);
    this.bindPorts();
    this.port.onMessage('control', {
      channel: 'control',
      config: this.config
    });
    this.emit('start');
  }
};

fdom.port.App.prototype.bindPorts = function() {
  eachProp(this.portMap, function(name, val) {
    this.port.on(name, this.emit.bind(this, val));
  }.bind(this));

  // Forward control channel.
  this.port.on('control', this.emit.bind(this, this.controlChannel));
};

/**
 * Load a module description from its manifest.
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
 * @method loadPermissions
 */
fdom.port.App.prototype.loadLinks = function() {
  var i;
  if (this.manifest.dependencies) {
    eachProp(this.manifest.dependencies, function(url, name) {
      var dep = new fdom.port.App(url);
      this.emit(this.controlChannel, {
        request: 'link',
        name: name,
        to: dep
      });
    }.bind(this));
  }
};
