var createTestPort = function(id) {
  var port = {
    id: id,
    messages: [],
    onMessage: function(from, msg) {
      this.messages.push([from, msg]);
      this.emit('onMessage', msg);
    },
    gotMessage: function(from, match) {
      var okay;
      for (var i = 0; i < this.messages.length; i++) {
        if (this.messages[i][0] === from) {
          okay = true;
          for (var j in match) {
            if (this.messages[i][1][j] !== match[j]) {
              okay = false;
            }
          }
          if (okay) {
            return this.messages[i][1];
          }
        }
      }
      return false;
    }
  };

  fdom.util.handleEvents(port);

  return port;
};

var mockIface = function(props, consts) {
  var iface = {};
  props.forEach(function(p) {
    iface[p[0]] = function(r) {
      return Promise.resolve(r);
    }.bind({}, p[1]);
    spyOn(iface, p[0]).and.callThrough();
  });
  if (consts) {
    consts.forEach(function(c) {
      iface[c[0]] = c[1];
    });
  }
  return function() {
    return iface;
  };
};

var createProxyFor = function(app, api) {
  setupResolvers();
  var global = {
    document: document
  };
  fdom.debug = new fdom.port.Debug();

  // Wrap the resolving subsystem to grab the child's 'freedom' object and promote it
  // to window before the internal script is loaded. 
  for(var i = 0; i < fdom.resources.resolvers.length; i++) {
    var resolver = fdom.resources.resolvers[i];
    fdom.resources.resolvers[i] = function(wrap, m, u, d) {
      if (u.lastIndexOf(".js") === u.length - 3) {
        window.freedom = global.freedom;
      }
      return wrap(m, u, d);
    }.bind({}, resolver);
  }
  
  var hub = new fdom.Hub(),
      site_cfg = {
        'debug': true,
        'portType': 'Direct',
        'appContext': false,
        'manifest': app,
        'resources': fdom.resources,
        'global': global
      },
      manager = new fdom.port.Manager(hub),
      proxy;
  
  if (api) {
    proxy = new fdom.port.Proxy(fdom.proxy.ApiInterface.bind({}, fdom.apis.get(api).definition));
  } else {
    proxy = new fdom.port.Proxy(fdom.proxy.EventInterface);
  }
  manager.setup(proxy);
  
  var link = location.protocol + "//" + location.host + location.pathname;
  fdom.resources.get(link, site_cfg.manifest).then(function(url) {
    var app = new fdom.port.Module(url, []);
    manager.setup(app);
    manager.createLink(proxy, 'default', app);
  });
  hub.emit('config', site_cfg);

  return proxy.getProxyInterface();
};

var fdom_src;
var getFreedomSource = function(id) {
  if(typeof fdom_src === 'undefined'){
    try {
      var xhr = new XMLHttpRequest();
      xhr.open("get", "freedom.js", false);
      xhr.overrideMimeType("text/javascript; charset=utf-8");
      xhr.send(null);
      fdom_src = xhr.responseText;
    } catch (err) { // Synchronous XHR wont work in Chrome App (Chrome Test Runner), so load from global var.
      if (typeof jasmine.getGlobal().freedom_src !== 'undefined') {
        fdom_src = jasmine.getGlobal().freedom_src;
      } else {
        throw "Could not load freedom source from XHR or global var. To work in a Chrome App, getFreedomSource() must be called from a jasmine test case or beforeEach()";
      }
    }
  }
  return fdom_src;
}

// Setup resource loading for the test environment, which uses file:// urls.
function setupResolvers() { 
  fdom.resources = new Resource();
  fdom.resources.addResolver(function(manifest, url, resolve) {
    if (url.indexOf('relative://') === 0) {
      var dirname = manifest.substr(0, manifest.lastIndexOf('/'));
      resolve(dirname + '/' + url.substr(11));
      return true;
    }
    return false;
  });
  fdom.resources.addResolver(function(manifest, url, resolve) {
    if (manifest.indexOf('file://') === 0) {
      manifest = 'http' + manifest.substr(4);
      fdom.resources.resolve(manifest, url).then(function(addr) {
        addr = 'file' + addr.substr(4);
        resolve(addr);
      });
      return true;
    }
    return false;
  });
  fdom.resources.addRetriever('file', fdom.resources.xhrRetriever);
}

function cleanupIframes() {
  var frames = document.getElementsByTagName('iframe');
  for (var i=0; i<frames.length; i++) {
    frames[i].parentNode.removeChild(frames[i]);
  }
}

function setupModule(manifest_url) {
  var freedom_src = getFreedomSource();
  var global = {console: {log: function(){}}, document: document};
  setupResolvers();

  var path = window.location.href;
  var dir_idx = path.lastIndexOf('/');
  var dir = path.substr(0, dir_idx) + '/';
  return fdom.setup(global, undefined, {
    manifest: manifest_url,
    portType: "Frame",
    inject: dir + "node_modules/es5-shim/es5-shim.js",
    src: freedom_src
  });
}

function ProviderHelper(inFreedom) {
  this.callId = 0;
  this.callbacks = {};
  this.unboundChanCallbacks = [];
  this.chanCallbacks = {};
  this.freedom = inFreedom;
  this._eventListeners = {};
  this.freedom.on("eventFired", this._on.bind(this));
  this.freedom.on("return", this.ret.bind(this));
  this.freedom.on("initChannel", this.onInitChannel.bind(this));
  this.freedom.on("inFromChannel", this.onInFromChannel.bind(this));
}
ProviderHelper.prototype.create = function(name, provider) {
  this.freedom.emit("create", {name: name,
                         provider: provider});
};

ProviderHelper.prototype.call = function(provider, method, args, cb) {
  this.callId += 1;
  this.callbacks[this.callId] = cb;
  this.freedom.emit('call', {
    id: this.callId,
    provider: provider,
    method: method,
    args: args
  });
  return this.callId;
};
ProviderHelper.prototype.ret = function(obj) {
  this.callbacks[obj.id](obj.data);
};

ProviderHelper.prototype._on = function(eventInfo) {
  var provider = eventInfo.provider;
  var event = eventInfo.event;
  var eventPayload = eventInfo.eventPayload;
  var listeners = this._eventListeners[provider][event];
  if (listeners) {
    listeners.forEach(function (listener) {
      listener(eventPayload);
    });
  }
};

ProviderHelper.prototype.on = function(provider, event, listener) {
  if (typeof this._eventListeners[provider] === 'undefined') {
    this._eventListeners[provider] = {};
  }
  if (typeof this._eventListeners[provider][event] === 'undefined') {
    this._eventListeners[provider][event] = [];
  }
  this._eventListeners[provider][event].push(listener);
  this.freedom.emit("listenForEvent", {provider: provider,
                                 event: event});
};

/**
 * Remove all listeners registered through "on" for an event. If an event is not
 * specified, then all listeners for the provider are removed.
 */
ProviderHelper.prototype.removeListeners = function(provider, event) {
  if (typeof this._eventListeners[provider] !== 'undefined') {
    if (event) {
      this._eventListeners[provider][event] = [];
    } else {
      this._eventListeners[provider] = {};
    }
  }
};

ProviderHelper.prototype.createProvider = function(name, provider) {
  this.freedom.emit('create', {
    name: name,
    provider: provider
  });
};

ProviderHelper.prototype.createChannel = function(cb) {
  this.unboundChanCallbacks.push(cb);
  this.freedom.emit('createChannel');
};

ProviderHelper.prototype.onInitChannel = function(chanId) {
  var cb = this.unboundChanCallbacks.pop(); 
  cb(chanId);
};

ProviderHelper.prototype.setChannelCallback = function(chanId, cb) {
  this.chanCallbacks[chanId] = cb;
};
ProviderHelper.prototype.sendToChannel = function(chanId, msg) {
  this.freedom.emit("outToChannel", {
    chanId: chanId,
    message: msg
  });
};
ProviderHelper.prototype.onInFromChannel = function(data) {
  this.chanCallbacks[data.chanId](data.message);
};
ProviderHelper.prototype.ab2str = function(buf) {
  return String.fromCharCode.apply(null, new Uint16Array(buf));
};
ProviderHelper.prototype.str2ab = function(str) {
  var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
  var bufView = new Uint16Array(buf);
  for (var i=0, strLen=str.length; i<strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
};
