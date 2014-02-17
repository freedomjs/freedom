/*globals fdom:true, Promise */
/*jslint indent:2,white:true,node:true,sloppy:true */
if (typeof fdom === 'undefined') {
  fdom = {};
}
fdom.port = fdom.port || {};

/**
 * The internal logic for module setup, which makes sure the public
 * facing exports have appropriate properties, and load user scripts.
 * @class ModuleInternal
 * @extends Port
 * @param {Port} manager The manager in this module to use for routing setup.
 * @constructor
 */
fdom.port.ModuleInternal = function(manager) {
  this.config = {};
  this.manager = manager;
  
  this.id = 'ModuleInternal-' + Math.random();
  this.pendingPorts = 0;
  this.requests = {};

  fdom.util.handleEvents(this);
};

/**
 * Message handler for this port.
 * This port only handles two messages:
 * The first is its setup from the manager, which it uses for configuration.
 * The second is from the module controller (fdom.port.Module), which provides
 * the manifest info for the module.
 * @method onMessage
 * @param {String} flow The detination of the message.
 * @param {Object} message The message.
 */
fdom.port.ModuleInternal.prototype.onMessage = function(flow, message) {
  if (flow === 'control') {
    if (!this.controlChannel && message.channel) {
      this.controlChannel = message.channel;
      fdom.util.mixin(this.config, message.config);
    }
  } else if (flow === 'default' && !this.appId) {
    // Recover the ID of this module:
    this.port = this.manager.hub.getDestination(message.channel);
    this.externalChannel = message.channel;
    this.appId = message.appId;
    this.lineage = message.lineage;

    var objects = this.mapProxies(message.manifest);

    this.once('start', this.loadScripts.bind(this, message.id, 
        message.manifest.app.script));
    this.loadLinks(objects);
  } else if (flow === 'default' && this.requests[message.id]) {
    this.requests[message.id](message.data);
    delete this.requests[message.id];
  }
};

/**
 * Get a textual description of this Port.
 * @method toString
 * @return {String} a description of this Port.
 */
fdom.port.ModuleInternal.prototype.toString = function() {
  return "[Module Environment Helper]";
};

/**
 * Attach a proxy to the externally visible namespace.
 * @method attach
 * @param {String} name The name of the proxy.
 * @param {Proxy} proxy The proxy to attach.
 * @private.
 */
fdom.port.ModuleInternal.prototype.attach = function(name, proxy) {
  var exp = this.config.global.freedom;

  if (!exp[name]) {
    exp[name] = proxy.getProxyInterface();
  }

  this.pendingPorts -= 1;
  if (this.pendingPorts === 0) {
    this.emit('start');
  }
};

/**
 * Request a set of proxy interfaces, and bind them to the external
 * namespace.
 * @method loadLinks
 * @param {Object[]} items Descriptors of the proxy ports to load.
 * @private
 */
fdom.port.ModuleInternal.prototype.loadLinks = function(items) {
  var i, proxy, provider, core;
  for (i = 0; i < items.length; i += 1) {
    if (items[i].def) {
      if (items[i].provides) {
        proxy = new fdom.port.Provider(items[i].def);
      } else {
        proxy = new fdom.port.Proxy(fdom.proxy.ApiInterface.bind({}, items[i].def));
      }
    } else {
      proxy = new fdom.port.Proxy(fdom.proxy.EventInterface);
    }
    
    this.manager.createLink(this.port, items[i].name, proxy);
    this.pendingPorts += 1;
    proxy.once('start', this.attach.bind(this, items[i].name, proxy));
  }
  
  // Allow resolution of files by parent.
  fdom.resources.addResolver(function(manifest, url, resolve) {
    var id = Math.random();
    this.emit(this.externalChannel, {
      type: 'resolve',
      id: id,
      data: url
    });
    this.requests[id] = resolve;
    return true;
  }.bind(this));

  // Attach Core.
  this.pendingPorts += 1;

  core = fdom.apis.get('core').definition;
  provider = new fdom.port.Provider(core);
  this.manager.getCore(function(CoreProv) {
    new CoreProv(this.manager).setId(this.lineage);
    provider.getInterface().provideAsynchronous(CoreProv);
  }.bind(this));

  this.emit(this.controlChannel, {
    type: 'Link to core',
    request: 'link',
    name: 'core',
    to: provider
  });

  proxy = new fdom.port.Proxy(fdom.proxy.ApiInterface.bind({}, core));
  this.manager.createLink(provider, 'default', proxy);
  this.attach('core', proxy);

  if (this.pendingPorts === 0) {
    this.emit('start');
  }
};

/**
 * Determine which proxy ports should be exposed by this module.
 * @method mapProxies
 * @param {Object} manifest the module JSON manifest.
 * @return {Object[]} proxy descriptors defined in the manifest.
 */
fdom.port.ModuleInternal.prototype.mapProxies = function(manifest) {
  var proxies = [], seen = ['core'], i, obj;
  
  if (manifest.permissions) {
    for (i = 0; i < manifest.permissions.length; i += 1) {
      obj = {
        name: manifest.permissions[i],
        def: undefined
      };
      obj.def = fdom.apis.get(obj.name).definition;
      if (seen.indexOf(obj.name) < 0 && obj.def) {
        proxies.push(obj);
        seen.push(obj.name);
      }
    }
  }
  
  if (manifest.dependencies) {
    fdom.util.eachProp(manifest.dependencies, function(desc, name) {
      obj = {
        name: name
      };
      if (seen.indexOf(name) < 0) {
        if (desc.api) {
          obj.def = fdom.apis.get(desc.api).definition;
        }
        proxies.push(obj);
        seen.push(name);
      }
    });
  }
  
  if (manifest.provides) {
    for (i = 0; i < manifest.provides.length; i += 1) {
      obj = {
        name: manifest.provides[i],
        def: undefined,
        provides: true
      };
      obj.def = fdom.apis.get(obj.name).definition;
      if (seen.indexOf(obj.name) < 0 && obj.def) {
        proxies.push(obj);
        seen.push(obj.name);
      }
    }
  }

  return proxies;
};

/**
 * Load external scripts into this namespace.
 * @method loadScripts
 * @param {String} from The URL of this modules's manifest.
 * @param {String[]} scripts The URLs of the scripts to load.
 */
fdom.port.ModuleInternal.prototype.loadScripts = function(from, scripts) {
  var i = 0,
      safe = true,
      importer = function importScripts(script, resolve) {
        this.config.global.importScripts(script);
        resolve();
      }.bind(this),
      urls = [],
      outstanding = 0,
      load = function(url) {
        urls.push(url);
        outstanding -= 1;
        if (outstanding === 0) {
          if (safe) {
            this.emit(this.externalChannel, {
              type: 'ready'
            });
            this.tryLoad(importer, urls);
          } else {
            this.tryLoad(importer, urls).then(function() {
              this.emit(this.externalChannel, {
                type: 'ready'
              });
            }.bind(this));
          }
        }
      }.bind(this);

  if (!this.config.global.importScripts) {
    safe = false;
    importer = function(url, resolve) {
      var script = this.config.global.document.createElement('script');
      script.src = url;
      script.addEventListener('load', resolve, true);
      this.config.global.document.body.appendChild(script);
    }.bind(this);
  }

  if (typeof scripts === 'string') {
    outstanding = 1;
    fdom.resources.get(from, scripts).then(load);
  } else {
    outstanding = scripts.length;
    for (i = 0; i < scripts.length; i += 1) {
      fdom.resources.get(from, scripts[i]).then(load);
    }
  }
};

/**
 * Attempt to load resolved scripts into the namespace.
 * @method tryLoad
 * @private
 * @param {Function} importer The actual import function
 * @param {String[]} urls The resoved URLs to load.
 * @returns {Promise} completion of load
 */
fdom.port.ModuleInternal.prototype.tryLoad = function(importer, urls) {
  var i,
      promises = [];
  try {
    for (i = 0; i < urls.length; i += 1) {
      promises.push(new Promise(importer.bind({}, urls[i])));
    }
  } catch(e) {
    fdom.debug.warn(e.stack);
    fdom.debug.error("Error loading " + urls[i], e);
    fdom.debug.error("If the stack trace is not useful, see https://" +
        "github.com/UWNetworksLab/freedom/wiki/Debugging-Script-Parse-Errors");
  }
  return Promise.all(promises);
};
