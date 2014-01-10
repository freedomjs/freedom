describe("/providers/storage/shared-storage", function() {
  var ASYNC_TIMEOUT = 4000;
  var freedom_src;

  var freedom, dir;
  beforeEach(function() {
    freedom_src = getFreedomSource();

    var global = {
      console: {
        log: function() {}
      }
    };
  
    // Setup resource loading for the test environment, which uses file:// urls.
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

    var path = window.location.href,
        dir_idx = path.lastIndexOf('/');
    dir = path.substr(0, dir_idx) + '/';

    // If running in a Chrome App with storage permission, lead the chrome local storage provider
    //*
    if(typeof chrome !== 'undefined' && typeof chrome.storage.local !== 'undefined'){
      window.freedomcfg = function(register) {
        var Storage_chromeStorageLocal = function(app) {
          this.app = app;
          handleEvents(this);
        };

        Storage_chromeStorageLocal.prototype.keys = function(continuation) {
          chrome.storage.local.get(null, function(items){
            keys = [];
            for(var itemKey in items){
              keys.push(itemKey);
            }
            continuation(keys);
          });
        };        

        Storage_chromeStorageLocal.prototype.get = function(key, continuation) {
          chrome.storage.local.get(key, function(ret){
            continuation(ret[key]);
          });
        };

        Storage_chromeStorageLocal.prototype.set = function(key, value, continuation) {
          items = {};
          items[key] = value;
          chrome.storage.local.set(items, continuation);
        };

        Storage_chromeStorageLocal.prototype.remove = function(key, continuation) {
          chrome.storage.local.remove(key, continuation);
        };

        Storage_chromeStorageLocal.prototype.clear = function(continuation) {
          chrome.storage.local.clear(continuation);
        };

        register("core.storage", Storage_chromeStorageLocal);
      };
    }
    //*/

    freedom = setup(global, undefined, {
      manifest: "relative://spec/helper/providers.json",
      portType: 'Frame',
      inject: dir + "node_modules/es5-shim/es5-shim.js",
      src: freedom_src
    });
  });
  
  afterEach(function() {
    var frames = document.getElementsByTagName('iframe');
    for (var i = 0; i < frames.length; i++) {
      frames[i].parentNode.removeChild(frames[i]);
    }
  });

  it("lets keys be set", function() {
    var cb = jasmine.createSpy('cb');
    var called = false;
    runs(function() {
      freedom.on('return', cb);
      freedom.on('return', function() {
        called = true;
      });
      freedom.emit('call', JSON.stringify({
        "method": "set",
        "args": ["testKey", "testVal"]
      }));
    });

    waitsFor(function() {
      return called;
    }, "RPC 'set' to storage.json module should return", ASYNC_TIMEOUT);

    runs(function() {
      expect(cb).toHaveBeenCalledWith(undefined);
    });
  });

  it("lets keys be retrieved", function() {
    var cb = jasmine.createSpy('cb');
    var called = false;
    runs(function() {
      freedom.on('return', cb);
      freedom.on('return', function() {
        called = true;
      });
      freedom.emit('call', JSON.stringify({
        "method": "set",
        "args": ["testKey", "testVal"]
      }));
    });

    waitsFor(function() {
      return called;
    }, "RPC 'set' to storage.json module should return", ASYNC_TIMEOUT);

    runs(function() {
      expect(cb).toHaveBeenCalledWith(JSON.undefined);
    });

    runs(function() {
      called = false;
      freedom.emit('call', JSON.stringify({
        "method": "get",
        "args": ["testKey"]
      }));
    });

    waitsFor(function() {
      return called;
    }, "RPC 'get' to storage.json module should return", ASYNC_TIMEOUT);

    runs(function() {
      expect(cb).toHaveBeenCalledWith(JSON.stringify('testVal'));
    });
  });

  it("lets keys be listed", function() {
    var cb = jasmine.createSpy('cb');
    var called = false;
    runs(function() {
      freedom.on('return', cb);
      freedom.on('return', function() {
        called = true;
      });
      freedom.emit('call', JSON.stringify({
        "method": "set",
        "args": ["testKey", "testVal"]
      }));
    });

    waitsFor(function() {
      return called;
    }, "RPC 'set' to storage.json module should return", ASYNC_TIMEOUT);

    runs(function() {
      expect(cb).toHaveBeenCalledWith(JSON.undefined);
    });

    runs(function() {
      called = false;
      freedom.emit('call', JSON.stringify({
        "method": "keys",
        "args": []
      }));
    });

    waitsFor(function() {
      return called;
    }, "RPC 'keys' to storage.json module should return", ASYNC_TIMEOUT);

    runs(function() {
      expect(cb).toHaveBeenCalledWith(JSON.stringify(['testKey']));
    });
  });

  it("clears the storage space", function(){
    var cb = jasmine.createSpy('cb');
    var called = false;

    // Clear the storage space
    runs(function() {
      freedom.on('return', cb);
      freedom.on('return', function() {
        called = true;
      });
      freedom.emit('call', JSON.stringify({
        "method": "clear",
        "args": []
      }));
    });

    waitsFor(function() {
      return called;
    }, "RPC 'clear' to storage.json module should return", ASYNC_TIMEOUT);

    runs(function() {
      expect(cb).toHaveBeenCalledWith(JSON.undefined);
    });

    // Check it is cleared
    runs(function() {
      called = false;
      freedom.emit('call', JSON.stringify({
        "method": "keys",
        "args": []
      }));
    });

    waitsFor(function() {
      return called;
    }, "RPC 'keys' to storage.json module should return", ASYNC_TIMEOUT);

    runs(function() {
      expect(cb).toHaveBeenCalledWith(JSON.stringify([]));
    });
  });
});
