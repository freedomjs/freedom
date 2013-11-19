/*globals fdom:true, handleEvents, mixin, eachProp */
/*jslint indent:2,white:true,node:true,sloppy:true */
if (typeof fdom === 'undefined') {
  fdom = {};
}
fdom.port = fdom.port || {};

/**
 * The internal configuration of an application, makes sure that the freedom
 * export has the appropriate properties, and loads user scripts.
 * @class AppInternal
 * @extends Port
 * @param {Port} manager The hub manager within this application to signal.
 * @constructor
 */
fdom.port.AppInternal = function(manager) {
  this.config = {};
  this.manager = manager;
  
  this.id = 'environment' + Math.random();
  this.pendingPorts = 0;
  this.requests = {};

  handleEvents(this);
};

/**
 * Message handler for this port.
 * The Internal app only handles two messages:
 * The first is its setup from the manager, which it uses for configuration.
 * The second is from the app external, which provides it with manifest info.
 * @method onMessage
 * @param {String} flow The detination of the message.
 * @param {Object} message The message.
 */
fdom.port.AppInternal.prototype.onMessage = function(flow, message) {
  if (flow === 'control') {
    if (!this.controlChannel && message.channel) {
      this.controlChannel = message.channel;
      mixin(this.config, message.config);
    }
  } else if (flow === 'default' && !this.appId) {
    // Recover the app:
    this.port = this.manager.hub.getDestination(message.channel);
    this.appChannel = message.channel;
    this.appId = message.appId;
    this.appLineage = message.lineage;

    var objects = this.mapProxies(message.manifest);

    this.once('start', this.loadScripts.bind(this, message.id, 
        message.manifest.app.script));
    this.loadLinks(objects);
  } else if (flow === 'default' && this.requests[message.id]) {
    this.requests[message.id].resolve(message.data);
  }
};

/**
 * Get a textual description of this Port.
 * @method toString
 * @return {String} a description of this Port.
 */
fdom.port.AppInternal.prototype.toString = function() {
  return "[App Environment Helper]";
};

/**
 * Attach a proxy to the externally visible namespace.
 * @method attach
 * @param {String} name The name of the proxy.
 * @param {Proxy} proxy The proxy to attach.
 * @private.
 */
fdom.port.AppInternal.prototype.attach = function(name, proxy) {
  var exp = this.config.global.freedom;

  if (!exp[name]) {
    exp[name] = function(p) {
      return p.getInterface();
    }.bind({}, proxy);
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
fdom.port.AppInternal.prototype.loadLinks = function(items) {
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
  fdom.resources.addResolver(function(manifest, url, deferred) {
    var id = Math.random();
    this.emit(this.appChannel, {
      type: 'resolve',
      id: id,
      data: url
    });
    this.requests[id] = deferred;
    return true;
  }.bind(this));

  // Attach Core.
  this.pendingPorts += 1;

  core = fdom.apis.get('core').definition;
  provider = new fdom.port.Provider(core);
  this.manager.getCore(function(CoreProv) {
    new CoreProv(this.manager).setId(this.appLineage);
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
 * Determine which proxy ports should be exposed by this application.
 * @method mapProxies
 * @param {Object} manifest the application JSON manifest.
 * @return {Object[]} proxy descriptors defined in the manifest.
 */
fdom.port.AppInternal.prototype.mapProxies = function(manifest) {
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
    eachProp(manifest.dependencies, function(desc, name) {
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
 * @param {String} from The URL of this application's manifest.
 * @param {String[]} scripts The URLs of the scripts to load.
 */
fdom.port.AppInternal.prototype.loadScripts = function(from, scripts) {
  var i = 0,
      safe = true,
      importer = function importScripts(script, deferred) {
        this.config.global.importScripts(script);
        deferred.resolve();
      }.bind(this),
      urls = [],
      outstanding = 0,
      load = function(url) {
        urls.push(url);
        outstanding -= 1;
        if (outstanding === 0) {
          if (safe) {
            this.emit(this.appChannel, {
              type: 'ready'
            });
            this.tryLoad(importer, urls);
          } else {
            this.tryLoad(importer, urls).done(function() {
              this.emit(this.appChannel, {
                type: 'ready'
              });
            }.bind(this));
          }
        }
      }.bind(this);

  if (!this.config.global.importScripts) {
    safe = false;
    importer = function(url, deferred) {
      var script = this.config.global.document.createElement('script');
      script.src = url;
      script.addEventListener('load', deferred.resolve.bind(deferred), true);
      this.config.global.document.body.appendChild(script);
    }.bind(this);
  }

  if (typeof scripts === 'string') {
    outstanding = 1;
    fdom.resources.get(from, scripts).done(load);
  } else {
    outstanding = scripts.length;
    for (i = 0; i < scripts.length; i += 1) {
      fdom.resources.get(from, scripts[i]).done(load);
    }
  }
};

/**
 * Attempt to load resolved scripts into the namespace.
 * @method tryLoad
 * @private
 * @param {Function} importer The actual import function
 * @param {String[]} urls The resoved URLs to load.
 * @returns {fdom.proxy.Deferred} completion of load
 */
fdom.port.AppInternal.prototype.tryLoad = function(importer, urls) {
  var i,
      deferred = fdom.proxy.Deferred(),
      def,
      left = urls.length,
      finished = function() {
        left -= 1;
        if (left === 0) {
          deferred.resolve();
        }
      };
  try {
    for (i = 0; i < urls.length; i += 1) {
      def = fdom.proxy.Deferred();
      def.done(finished);
      importer(urls[i], def);
    }
  } catch(e) {
    console.warn(e.stack);
    console.error("Error loading " + urls[i], e);
  }
  return deferred.promise();
};
