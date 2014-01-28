describe("storage.shared.json", function() {
  var proxy;
  beforeEach(function() {
    proxy = createProxyFor("providers/storage/shared/storage.shared.json", "storage");
  });

  it("Returns Keys", function() {
    var val = undefined;
    var p = proxy();

    runs(function() {
      p.set('key', 'myvalue').done(function() {
        p.get('key').done(function(ret) {
          val = ret;
        });
      })
    });
    waitsFor("Key to be round-tripped", function() {
      return val != undefined;
    }, 1000);
    runs(function() {
      expect(val).toEqual('myvalue');
      p.clear().done(function() {
        val = undefined;
      });
    });
    waitsFor('Cleanup to finish', function() {
      return val == undefined;
    }, 1000);
  });
});

describe("/providers/storage/shared/storage.shared.json", function() {
  var ASYNC_TIMEOUT = 4000;
  var freedom_src;

  var freedom, dir;
  beforeEach(function() {
    freedom_src = getFreedomSource();
    var global = {console: {log: function() {}}};
    setupResolvers();
    var path = window.location.href,
        dir_idx = path.lastIndexOf('/');
    dir = path.substr(0, dir_idx) + '/';

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
