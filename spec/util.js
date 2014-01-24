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
  fdom.resources.get(link, site_cfg.manifest).done(function(url) {
    var app = new fdom.port.App(url, []);
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
  fdom.resources.addResolver(function(manifest, url, deferred) {
    if (url.indexOf('relative://') === 0) {
      var dirname = manifest.substr(0, manifest.lastIndexOf('/'));
      deferred.resolve(dirname + '/' + url.substr(11));
      return true;
    }
    return false;
  });
  fdom.resources.addResolver(function(manifest, url, deferred) {
    if (manifest.indexOf('file://') === 0) {
      manifest = 'http' + manifest.substr(4);
      fdom.resources.resolve(manifest, url).done(function(addr) {
        addr = 'file' + addr.substr(4);
        deferred.resolve(addr);
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
