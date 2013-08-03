if (typeof fdom === 'undefined') {
  fdom = {};
}
fdom.app = fdom.app || {};

/**
 * The internal interface for a freedom application.
 * Manages all active channels for the application, and allows
 * proxy objects to be created for them.
 * @constructor
 */
fdom.app.Internal = function() {
  this.config = {};
  this.channels = {};
  this.manifest = {};
  handleEvents(this);
};

fdom.app.Internal.prototype.configure = function(config) {
  mixin(this.config, config, true);
};

fdom.app.Internal.prototype.getChannel = function(flow) {
  if (!this.manifest || !this.id) {
    this.start();
  }

  if (!flow) {
    flow = 'default';
  }

  if (!this.channels[flow]) {
    this.channels[flow] = new fdom.Channel(this, flow);
  }
  return this.channels[flow];
};
  
fdom.app.Internal.prototype.getProxy = function(flow) {
  var proxy = new fdom.Proxy(this.getChannel(flow));
  if (!this.config.exports) {
    this.config.exports = proxy;
  }
  return proxy;
};

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
    this.configure(control.data.msg.config);
    
    this.loadPermissions();
    this.loadDependencies();
    this.loadProvides();

    this.postMessage({
      sourceFlow: 'control',
      request: 'ready'
    });

    var is = this.config.global.importScripts;
    this.config.global.importScripts = function(prefix, src) {
      try {
        is(resolvePath(src, prefix));
      } catch (e) {
        console.log(e.message+'\n'+e.stack);
      }
    }.bind({}, this.id);

    var appURL = resolvePath(this.manifest['app']['script'], this.id);
    this.config.global.importScripts(appURL);
  }.bind(this));
  
  // Post creation message to get the info.
  this.postMessage({
    sourceFlow: 'control',
    request: 'create'
  });
};

fdom.app.Internal.prototype.postMessage = function(msg) {
  this.config.global.postMessage(msg);
};

fdom.app.Internal.prototype.debug = function(msg) {
  if (this.config.debug) {
    this.postMessage({
      sourceFlow: 'control',
      request: 'debug',
      msg: msg.toString()
    });
  }
};

fdom.app.Internal.prototype._attach = function(exp, name, def, provider) {
  exp[name] = function(name_, def_, provider_) {
    return new fdom.Proxy(this.getChannel(provider_ ? undefined : name_), def_, provider_);
  }.bind(this, name, def, provider);
};

fdom.app.Internal.prototype.loadPermissions = function() {
  var permissions = [];
  var exp = this.config.exports;
  var i ;
  if(this.manifest && this.manifest['permissions']) {
    for (i = 0; i < this.manifest['permissions'].length; i++) {
      permissions.push(this.manifest['permissions'][i]);
    }
  }

  for (i = 0; i < permissions.length; i++) {
    var api = fdom.apis.get(permissions[i]);
    if (!api) {
      continue;
    }
    this._attach(exp, api.name, api.definition);
  }

  //Core API is handled locally, to facilitate channel setup.
  var coreAPI = fdom.apis.get('core');
  var pipe = fdom.Channel.pipe();
  fdom.apis.bindCore('core', pipe[1]);
  exp['core'] = new fdom.Proxy(pipe[0], coreAPI.definition);
};

fdom.app.Internal.prototype.loadDependencies = function() {
  /*jshint unused:true */
  if(this.manifest && this.manifest['dependencies']) {
    var exports = this.config.exports;
    eachProp(this.manifest['dependencies'], function(url, name) {
      var dep = function(n) {
        var proxy = this.getProxy(n);
        this.postMessage({
          sourceFlow: 'control',
          request: 'dep',
          dep: n
        });
        return proxy;
      }.bind(this, name);
      if (!exports[name]) {
        exports[name] = dep;
      } else {
        dep();
      }
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
      this._attach(exp, api.name, api.definition, true);
    }
  }
};
