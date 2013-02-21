var fdom = fdom || {};
fdom.app = fdom.app || {};

/**
 * The external interface for a freedom application.
 * Manages all active channels for the application, and allows
 * proxy objects to be created for them.  Also manages the
 * canonical view of the metadata for the application.
 */
fdom.app.External = function() {
  this.id;
  this.config = {
    manifest: 'manifest.json',
    source: 'freedom.js'
  };
  this.channels = {};
  this.manifest = {};
  this.worker = null;
  this.state = false;
  
  handleEvents(this);
}

fdom.app.External.prototype.configure = function(config) {
  mixin(this.config, config, true);
}

fdom.app.External.prototype.getProxy = function(flow) {
  var channel = this.getChannel(flow);

  var proxy = new fdom.Proxy(channel);
  if (!this.config.exports) {
    this.config.exports = proxy;
  }
  return proxy;
}

fdom.app.External.prototype.getChannel = function(flow) {
  if (!this.manifest || !this.id) {
    this.id = makeAbsolute(this.config.manifest);
    this.loadManifest(this.id);
  }
  
  if (!flow) {
    flow = 'default'
  }
  if (!this.channels[flow]) {
    this.channels[flow] = new fdom.Channel(this, flow);
  }
  return this.channels[flow];
}

/**
 * Load the description of the app.
 */
fdom.app.External.prototype.loadManifest = function(manifest) {
  var ref = new XMLHttpRequest();
  ref.addEventListener('readystatechange', function(e) {
    if (ref.readyState == 4 && ref.responseText) {
      var resp = {};
      try {
        resp = JSON.parse(ref.responseText);
      } catch(e) {
        return errback(e);
      }
      this.onManifest(resp);
    } else if (ref.readyState == 4) {
      console.warn(ref.status);
    }
  }.bind(this), false);
  ref.open("GET", manifest, true);
  ref.send();
}
    
fdom.app.External.prototype.onManifest = function(manifest) {
  if (manifest && manifest['app'] && manifest['app']['script']) {
    this.manifest = manifest;
    fdom.Hub.get().register(this);
    this['emit']('manifest');
    this.start();
  } else {
    console.warn(manifest['name'] + " does not specify a valid application.");
  }
}

/**
 * Start the application context.
 */
fdom.app.External.prototype.start = function() {
  if (this.worker) {
    this.worker.terminate();
    this.worker = null;
    this.state = false;
  }
  this.worker = new Worker(this.config.source);
  this.worker.addEventListener('message', function(msg) {
    fdom.Hub.get().onMessage(this, msg.data);
  }.bind(this), true);
  this['once']('ready', function() {
    this.state = true;
  }.bind(this));
};

fdom.app.External.prototype.postMessage = function(msg) {
  if (this.state || (this.worker && msg.sourceFlow == "control")) {
    this.worker.postMessage(msg);
  } else {
    this['once']('ready', function(m) {
      this.postMessage(m);
    }.bind(this, msg));
  }
}
