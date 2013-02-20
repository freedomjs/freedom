var fdom = fdom || {};
fdom.app = fdom.app || {};

/**
 * The internal interface for a freedom application.
 * Manages all active channels for the application, and allows
 * proxy objects to be created for them.
 */
fdom.app.Internal = function() {
  this.id;
  this.config = {};
  this.channels = {};
  this.manifest = {};
  handleEvents(this);
}

fdom.app.Internal.prototype.configure = function(config) {
  mixin(this.config, config, true);
}

fdom.app.Internal.prototype.getProxy = function(flow) {
  if (!this.manifest || !this.id) {
    this.start();
  }

  if (!flow) {
    flow = 'default'
  }

  if (!this.channels[flow]) {
    this.channels[flow] = new fdom.Channel(this, flow);
  }
  
  var proxy = new fdom.Proxy(this.channels[flow]);
  if (!this.config.exports) {
    this.config.exports = proxy;
  }
  return proxy;
}

/**
 * Start communication back to the executor.
 */
fdom.app.Internal.prototype.start = function() {
  this.config.global.addEventListener('message', function(msg) {
    if (msg.data && msg.data.sourceFlow) {
      var chan = this.channels[msg.data.sourceFlow];
      if (chan) {
        chan.onMessage(msg.data.msg);
      } else if (msg.data && msg.data.sourceFlow == 'control') {
        this['emit']('message', msg);
      }
    }
  }.bind(this), true);

  // Wait to get information about this application from the creator.
  this['once']('message', function(control) {
    this.id = control.data.msg.id;
    this.manifest = control.data.msg.manifest;
    
    this.loadDependencies();
    this.loadProvides();

    this.postMessage({
      sourceFlow: 'control',
      request: 'ready'
    });

    var appURL = this.id.substr(0, this.id.lastIndexOf("/")) + "/"  + this.manifest['app']['script'];
    importScripts(appURL);
  }.bind(this));
  
  // Post creation message to get the info.
  this.postMessage({
    sourceFlow: 'control',
    request: 'create'
  });
}

fdom.app.Internal.prototype.postMessage = function(msg) {
  this.config.global.postMessage(msg);
}

fdom.app.Internal.prototype.debug = function(msg) {
  this.postMessage({
    sourceFlow: 'control',
    request: 'debug',
    msg: msg
  });
}

fdom.app.Internal.prototype.loadDependencies = function() {
  if(this.manifest && this.manifest['dependencies']) {
    var exp = this.config.exports;
    eachProp(this.manifest['dependencies'], function(url, name) {
      exp[name] = function(n) {
        var proxy = this.getProxy(n);
        this.postMessage({
          sourceFlow: 'control',
          request: 'dep',
          dep: n
        });
        return proxy;
      }.bind(this, name);
    }.bind(this));
  }
};

fdom.app.Internal.prototype.loadProvides = function() {
  if(this.manifest && this.manifest['provides']) {
    var exp = this.config.exports;
    for (var i = 0; i < this.manifest['provides'].length; i++) {
      var api = fdom.apis.get(this.manifest['provides'][i]);
      if (!api) {
        continue;
      }
      exp[api.name] = function(dfn) {
        var proxy = new fdom.Proxy(this.channels['default'], dfn);
        return proxy;
      }.bind(this, api.definition);
    }
  }
}
