/*globals fdom:true, handleEvents, mixin, eachProp, XMLHttpRequest, resolvePath */
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
  } else if (flow === 'default') {
    // Recover the app:
    this.port = this.manager.hub.getDestination(message.channel);
    this.appChannel = message.channel;
    this.appId = message.appId;

    var objects = this.mapProxies(message.manifest);

    this.once('start', this.loadScripts.bind(this, message.id, 
        message.manifest.app.script));
    this.loadLinks(objects);
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

  // Attach Core.
  this.pendingPorts += 1;

  core = fdom.apis.get('core').definition;
  provider = new fdom.port.Provider(core);
  provider.getInterface().provideAsynchronous(fdom.apis.getCore('core', this));

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
    eachProp(manifest.dependencies, function(url, name) {
      obj = {
        name: name
      };
      if (seen.indexOf(name) < 0) {
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
  var i, importer = this.config.global.importScripts;
  this.emit(this.appChannel, {
    type: 'ready'
  });
  if (!importer) {
    importer = function(url) {
      var script = this.config.global.document.createElement('script');
      script.src = url;
      this.config.global.document.body.appendChild(script);
    }.bind(this);
  }
  try {
    if (typeof scripts === 'string') {
      importer(resolvePath(scripts, from));
    } else {
      for (i = 0; i < scripts.length; i += 1) {
        importer(resolvePath(scripts[i], from));
      }
    }
  } catch(e) {
    console.error("Error Loading ", scripts, e.message);
  }
};

