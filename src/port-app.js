/*globals fdom:true, handleEvents, mixin, eachProp, XMLHttpRequest, makeAbsolute */
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
  this.externalPortMap = {};
  this.internalPortMap = {};

  handleEvents(this);
};

fdom.port.App.prototype.onMessage = function(flow, message) {
  if (flow === 'control') {
    if (!this.controlChannel && message.channel) {
      this.controlChannel = message.channel;
      mixin(this.config, message.config);
      this.start();
    } else if (!this.port && message.channel) {
      this.externalPortMap[message.name] = message.channel;
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
      if (this.externalPortMap[flow] === false && message.channel) {
        this.externalPortMap[flow] = message.channel;
        return;
      }
      console.log('mapping for ' + flow + ' was ' + this.internalPortMap[flow]);
      if (this.internalPortMap[flow] === false) {
        this.once('bound', this.onMessage.bind(this, flow, message));
      } else {
        this.port.onMessage(this.internalPortMap[flow], message);
      }
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
    // Tell the local port to ask us for help.
    this.port.onMessage('control', {
      channel: 'control',
      config: this.config
    });
    // Tell the remote location to instantate the app.
    this.port.onMessage('control', {
      type: 'Load Scripts',
      request: 'load',
      scripts: this.manifest.app.script,
      from: makeAbsolute(this.manifestId)
    });
    this.emit('start');
  }
};

fdom.port.App.prototype.toString = function() {
  return "[App " + this.manifestId + "]";
};

fdom.port.App.prototype.emitMessage = function(name, message) {
  console.log('emitting ' + name);
  if (this.internalPortMap[name] === false && message.channel) {
    this.internalPortMap[name] = message.channel;
    this.emit('bound');
    return;
  }
  this.emit(this.externalPortMap[name], message);
  return false;
};

fdom.port.App.prototype.bindPorts = function() {
  this.port.on(this.emitMessage.bind(this));
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
  var i, channels = ['default'];
  if (this.manifest.dependencies) {
    eachProp(this.manifest.dependencies, function(url, name) {
      channels.push(name);
      var dep = new fdom.port.App(url);
      this.emit(this.controlChannel, {
        request: 'link',
        name: name,
        to: dep
      });
    }.bind(this));
  }
  for (i = 0; i < channels.length; i += 1) {
    this.externalPortMap[channels[i]] = false;
    this.internalPortMap[channels[i]] = false;
  }
};
