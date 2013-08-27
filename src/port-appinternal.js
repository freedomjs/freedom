/*globals fdom:true, handleEvents, mixin, eachProp, XMLHttpRequest, resolvePath */
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
fdom.port.AppInternal = function(manager) {
  this.config = {};
  this.manager = manager;
  
  this.id = 'environment' + Math.random();
  this.pendingPorts = 0;

  handleEvents(this);
};

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

    var objects = this.mapProxies(message.manifest);

    this.once('start', this.loadScripts.bind(this, message.id, 
        message.manifest.app.script));
    this.loadLinks(objects);
  }
};

fdom.port.AppInternal.prototype.toString = function() {
  return "[App Environment Helper]";
};

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

fdom.port.AppInternal.prototype.loadLinks = function(items) {
  var i, proxy;
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

  if (this.pendingPorts === 0) {
    this.emit('start');
  }
};

fdom.port.AppInternal.prototype.mapProxies = function(manifest) {
  var proxies = [], seen = [], i, obj;
  
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

fdom.port.AppInternal.prototype.loadScripts = function(from, scripts) {
  var i, importer = this.config.global.importScripts;
  this.emit(this.appChannel, {
    type: 'ready'
  });
  if (importer) {
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
  }
};

