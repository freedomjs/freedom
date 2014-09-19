var Api = require('../src/api');
var Resource = require('../src/resource');
var util = require('../src/util');

exports.createTestPort = function(id) {
  var port = {
    id: id,
    messages: [],
    gotMessageCalls: [],
    checkGotMessage: function() {
      var len = this.gotMessageCalls.length;
      for (var i=0; i<len; i++) {
        var call = this.gotMessageCalls.shift();
        var result = this.gotMessage(call.from, call.match);
        if (result !== false) {
          call.callback(result);
        } else {
          this.gotMessageCalls.push(call);
        }
      }
    },
    onMessage: function(from, msg) {
      this.messages.push([from, msg]);
      this.emit('onMessage', msg);
      this.checkGotMessage();
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
    },
    gotMessageAsync: function(from, match, callback) {
      this.gotMessageCalls.push({
        from: from,
        match: match,
        callback: callback
      });
      this.checkGotMessage();
    }
    
  };

  util.handleEvents(port);

  return port;
};

exports.createMockPolicy = function() {
  return {
    api: new Api()
  };
};

exports.mockIface = function(props, consts) {
  var iface = {};
  props.forEach(function(p) {
    if (p[1] && p[1].then) {
      iface[p[0]] = function(r) {
        return r;
      }.bind({}, p[1]);
    } else {
      iface[p[0]] = function(r) {
        return Promise.resolve(r);
      }.bind({}, p[1]);
    }
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

var fdom_src;
exports.getFreedomSource = function(id) {
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
exports.getResolvers = function() {
  var resolvers = [];
  resolvers.push({'resolver': function(manifest, url, resolve) {
    if (url.indexOf('relative://') === 0) {
      var loc = location.protocol + "//" + location.host + location.pathname;
      var dirname = loc.substr(0, loc.lastIndexOf('/'));
      resolve(dirname + '/' + url.substr(11));
      return true;
    }
    resolve(false);
    return false;
  }});
  resolvers.push({'resolver': function(manifest, url, resolve) {
    if (manifest && manifest.indexOf('file://') === 0) {
      manifest = 'http' + manifest.substr(4);
      rsrc.resolve(manifest, url).then(function(addr) {
        addr = 'file' + addr.substr(4);
        resolve(addr);
      });
      return true;
    }
    resolve(false);
    return false;
  }});
  var rsrc = new Resource();
  resolvers.push({'proto':'file', 'retriever': rsrc.xhrRetriever});
  return resolvers;
}

exports.setupResolvers = function() { 
  var rsrc = new Resource();
  rsrc.register(exports.getResolvers());
  return rsrc;
}

exports.cleanupIframes = function() {
  var frames = document.getElementsByTagName('iframe');
  // frames is a live HTMLCollection, so it is modified each time an
  // element is removed.
  while (frames.length > 0) {
    frames[0].parentNode.removeChild(frames[0]);
  }
}

exports.setupModule = function(manifest_url) {
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

exports.providerFor = function(module, api) {
  var manifest = {
    name: 'providers',
    app: {script: 'relative://spec/helper/providers.js'},
    dependencies: {undertest: {url: 'relative://' + module, api: api}}
  };
  var freedom = setupModule('manifest://' + JSON.stringify(manifest));
  var provider = new ProviderHelper(freedom);
  provider.create = function(name) {
    this.freedom.emit("create", {name: name, provider: 'undertest'});
  };
  return provider;
}

function ProviderHelper(inFreedom) {
  this.callId = 0;
  this.callbacks = {};
  this.errcallbacks = {};
  this.unboundChanCallbacks = [];
  this.chanCallbacks = {};
  this.freedom = inFreedom;
  this._eventListeners = {};
  this.freedom.on("eventFired", this._on.bind(this));
  this.freedom.on("return", this.ret.bind(this));
  this.freedom.on("error", this.err.bind(this));
  this.freedom.on("initChannel", this.onInitChannel.bind(this));
  this.freedom.on("inFromChannel", this.onInFromChannel.bind(this));
}

ProviderHelper.prototype.createProvider = function(name, provider,
                                                   constructorArguments) {
  this.freedom.emit('create', {
    name: name,
    provider: provider,
    constructorArguments: constructorArguments
  });
};

ProviderHelper.prototype.create = ProviderHelper.prototype.createProvider;

ProviderHelper.prototype.call = function(provider, method, args, cb, errcb) {
  this.callId += 1;
  this.callbacks[this.callId] = cb;
  this.errcallbacks[this.callId] = errcb;
  this.freedom.emit('call', {
    id: this.callId,
    provider: provider,
    method: method,
    args: args
  });
  return this.callId;
};

ProviderHelper.prototype.ret = function(obj) {
  if (this.callbacks[obj.id]) {
    this.callbacks[obj.id](obj.data);
    delete this.callbacks[obj.id];
  }
};

ProviderHelper.prototype.err = function(obj) {
  if (this.errcallbacks[obj.id]) {
    this.errcallbacks[obj.id](obj.data);
    delete this.errcallbacks[obj.id];
  }
}

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

exports.ProviderHelper = ProviderHelper;