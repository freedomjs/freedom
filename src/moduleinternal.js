/*globals Promise */
/*jslint indent:2,white:true,node:true,sloppy:true */
var debug = require('debug');
var ApiInterface = require('proxy/apiInterface');
var EventInterface = require('proxy/eventInterface');
var Provider = require('provider');
var Proxy = require('proxy');
var util = require('util');

/**
 * The internal logic for module setup, which makes sure the public
 * facing exports have appropriate properties, and load user scripts.
 * @class ModuleInternal
 * @extends Port
 * @param {Port} manager The manager in this module to use for routing setup.
 * @constructor
 */
var ModuleInternal = function(manager) {
  this.config = {};
  this.manager = manager;
  this.api = this.manager.api;
  this.manifests = {};
  
  this.id = 'ModuleInternal-' + Math.random();
  this.pendingPorts = 0;
  this.requests = {};
  this.defaultProvider = null;

  util.handleEvents(this);
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
ModuleInternal.prototype.onMessage = function(flow, message) {
  if (flow === 'control') {
    if (!this.controlChannel && message.channel) {
      this.controlChannel = message.channel;
      util.mixin(this.config, message.config);
    }
  } else if (flow === 'default' && !this.appId) {
    // Recover the ID of this module:
    this.port = this.manager.hub.getDestination(message.channel);
    this.externalChannel = message.channel;
    this.appId = message.appId;
    this.lineage = message.lineage;

    var objects = this.mapProxies(message.manifest);

    this.updateEnv(message.manifest);
    this.once('start', this.loadScripts.bind(this, message.id,
        message.manifest.app.script));
    this.loadLinks(objects);
  } else if (flow === 'default' && this.requests[message.id]) {
    this.requests[message.id](message.data);
    delete this.requests[message.id];
  } else if (flow === 'default' && message.type === 'manifest') {
    this.emit('manifest', message);
    this.updateManifest(message.name, message.manifest);
  } else if (flow === 'default' && message.type === 'Connection') {
    // Multiple connections can be made to the default provider.
    if (this.defaultProvider) {
      this.manager.createLink(this.defaultProvider, message.channel,
                              this.port, message.channel);
    }
  }
};

/**
 * Get a textual description of this Port.
 * @method toString
 * @return {String} a description of this Port.
 */
ModuleInternal.prototype.toString = function() {
  return "[Environment Helper]";
};

/**
 * Attach the manifest of the active module to the externally visible namespace.
 * @method updateEnv
 * @param {Object} manifest The manifest of the module.
 * @private
 */
ModuleInternal.prototype.updateEnv = function(manifest) {
  // Decide if/what other properties should be exported.
  // Keep in sync with Module.updateEnv
  var exp = this.config.global.freedom, metadata = {
    name: manifest.name,
    icon: manifest.icon,
    description: manifest.description
  };

  if (exp) {
    exp.manifest = metadata;
  }
};

/**
 * Attach a proxy to the externally visible namespace.
 * @method attach
 * @param {String} name The name of the proxy.
 * @param {Proxy} proxy The proxy to attach.
 * @param {String} api The API the proxy implements.
 * @private.
 */
ModuleInternal.prototype.attach = function(name, proxy, api) {
  var exp = this.config.global.freedom;

  if (!exp[name]) {
    exp[name] = proxy.getProxyInterface();
    if (api) {
      exp[name].api = api;
    }
    if (this.manifests[name]) {
      exp[name].manifest = this.manifests[name];
    }
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
ModuleInternal.prototype.loadLinks = function(items) {
  var i, proxy, provider, core,
      manifestPredicate = function(name, flow, msg) {
        return flow === 'manifest' && msg.name === name;
      },
      onManifest = function(item, msg) {
        var definition = {
          name: item.api,
          definition: msg.manifest.api[item.api]
        };
        this.loadLink(item.name, definition);
      };

  for (i = 0; i < items.length; i += 1) {
    if (items[i].provides && !items[i].def) {
      debug.error('Module ' +this.appId + ' not loaded');
      debug.error('Unknown provider: ' + items[i].name);
    } else if (items[i].api && !items[i].def) {
      this.once(manifestPredicate.bind({}, items[i].name),
                onManifest.bind(this, items[i]));
    } else {
      this.loadLink(items[i].name, items[i].def);
    }
    this.pendingPorts += 1;
  }
  
  // Allow resolution of files by parent.
  this.manager.resource.addResolver(function(manifest, url, resolve) {
    var id = Math.random();
    this.requests[id] = resolve;
    this.emit(this.externalChannel, {
      type: 'resolve',
      id: id,
      data: url
    });
    return true;
  }.bind(this));

  // Attach Core.
  this.pendingPorts += 1;

  core = this.api.get('core').definition;
  provider = new Provider(core);
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

  proxy = new Proxy(ApiInterface.bind({}, core));
  this.manager.createLink(provider, 'default', proxy);
  this.attach('core', proxy);

  if (this.pendingPorts === 0) {
    this.emit('start');
  }
};

/**
 * Create a proxy for a single manifest item, and attach it to the global
 * context once it is loaded.
 * @method loadLink
 * @param {String} name The name of the link
 * @param {Object} [definition] The definition of the API to expose.
 * @param {String} definition.name The name of the API for the link.
 * @param {Object} definition.definition The definition of the API.
 * @param {Boolean} definition.provides Whether the link is a provider.
 * @private
 */
ModuleInternal.prototype.loadLink = function(name, definition) {
  var proxy, api;
  if (definition) {
    api = definition.name;
    if (definition.provides) {
      proxy = new Provider(definition.definition);
      if (!this.defaultProvider) {
        this.defaultProvider = proxy;
      }
    } else {
      proxy = new Proxy(ApiInterface.bind({},
          definition.definition));
    }
  } else {
    proxy = new Proxy(EventInterface);
  }
    
  proxy.once('start', this.attach.bind(this, name, proxy, api));
  this.manager.createLink(this.port, name, proxy);
};

/**
 * Update the exported manifest of a dependency.
 * Sets it internally if not yet exported, or attaches the property if it
 * is loaded after the module has started (we don't delay start to retreive
 * the manifest of the dependency.)
 * @method updateManifest
 * @param {String} name The Dependency
 * @param {Object} manifest The manifest of the dependency
 */
ModuleInternal.prototype.updateManifest = function(name, manifest) {
  var exp = this.config.global.freedom;

  if (exp[name]) {
    exp[name].manifest = manifest;
  } else {
    this.manifests[name] = manifest;
  }
};

/**
 * Determine which proxy ports should be exposed by this module.
 * @method mapProxies
 * @param {Object} manifest the module JSON manifest.
 * @return {Object[]} proxy descriptors defined in the manifest.
 */
ModuleInternal.prototype.mapProxies = function(manifest) {
  var proxies = [], seen = ['core'], i, obj;
  
  if (manifest.permissions) {
    for (i = 0; i < manifest.permissions.length; i += 1) {
      obj = {
        name: manifest.permissions[i],
        def: undefined
      };
      obj.def = this.api.get(obj.name);
      if (seen.indexOf(obj.name) < 0 && obj.def) {
        proxies.push(obj);
        seen.push(obj.name);
      }
    }
  }
  
  if (manifest.dependencies) {
    util.eachProp(manifest.dependencies, function(desc, name) {
      obj = {
        name: name,
        api: desc.api
      };
      if (seen.indexOf(name) < 0) {
        if (desc.api) {
          obj.def = this.api.get(desc.api);
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
        def: undefined
      };
      obj.def = this.api.get(obj.name);
      if (obj.def) {
        obj.def.provides = true;
      } else if (manifest.api && manifest.api[obj.name]) {
        obj.def = {
          name: obj.name,
          definition: manifest.api[obj.name],
          provides: true
        };
      }
      if (seen.indexOf(obj.name) < 0) {
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
ModuleInternal.prototype.loadScripts = function(from, scripts) {
  // TODO(salomegeo): add a test for failure.
  var importer = function importScripts(script, resolve, reject) {
    try {
        this.config.global.importScripts(script);
        resolve();
    } catch(e) {
      reject(e);
    }
  }.bind(this),
      scripts_count,
      load;
  if (typeof scripts === 'string') {
    scripts_count = 1;
  } else {
    scripts_count = scripts.length;
  }

  load = function(next) {
    if (next === scripts_count) {
      this.emit(this.externalChannel, {
        type: "ready"
      });
      return;
    }

    var script;
    if (typeof scripts === 'string') {
      script = scripts;
    } else {
      script = scripts[next];
    }

    this.manager.resource.get(from, script).then(function(url) {
      this.tryLoad(importer, url).then(function() {
        load(next + 1);
      }.bind(this));
    }.bind(this));
  }.bind(this);



  if (!this.config.global.importScripts) {
    importer = function(url, resolve, reject) {
      var script = this.config.global.document.createElement('script');
      script.src = url;
      script.addEventListener('load', resolve, true);
      this.config.global.document.body.appendChild(script);
    }.bind(this);
  }

  load(0);
};

/**
 * Attempt to load resolved scripts into the namespace.
 * @method tryLoad
 * @private
 * @param {Function} importer The actual import function
 * @param {String[]} urls The resoved URLs to load.
 * @returns {Promise} completion of load
 */
ModuleInternal.prototype.tryLoad = function(importer, url) {
  return new Promise(importer.bind({}, url)).fail(function(e) {
    debug.warn(e.stack);
    debug.error("Error loading " + url, e);
    debug.error("If the stack trace is not useful, see https://" +
        "github.com/freedomjs/freedom/wiki/Debugging-Script-Parse-Errors");
  });
};

module.exports = ModuleInternal;
