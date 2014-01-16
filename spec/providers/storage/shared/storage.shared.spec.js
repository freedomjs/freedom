describe("storage.shared/isolated.json", function() {
  var proxy;
  var TIMEOUT = 1000;
  beforeEach(function() {
    //proxy = createProxyFor("providers/storage/shared/storage.shared.json", "storage");
    proxy = createProxyFor("providers/storage/isolated/storage.isolated.json", "storage");
  });

  it("sets and gets keys", function() {
    var p = proxy();
    var val = undefined;

    runs(function() {
      p.set('key', 'myvalue').done(function() {
        p.get('key').done(function(ret) {
          val = ret;
        });
      })
    });
    waitsFor("Key to be round-tripped", function() {
      return val != undefined;
    }, TIMEOUT);
    runs(function() {
      expect(val).toEqual('myvalue');
      p.clear().done(function() {
        val = undefined;
      });
    });
    waitsFor('Cleanup to finish', function() {
      return val == undefined;
    }, TIMEOUT);
  });

  it("lists keys that have been set", function() {
    var p = proxy();
    var keys = undefined;

    runs(function() {
      p.set('k1', 'v1').done(function() {
        p.set('k2', 'v2').done(function() {
          p.keys().done(function(ret) {
            keys = ret;
          });
        });
      });
    });
    waitsFor("keys to be set", function() {
      return keys != undefined;
    }, TIMEOUT);
    runs(function() {
      expect(keys.length).toEqual(2);
      expect(keys).toContain('k1');
      expect(keys).toContain('k2');
      p.clear().done(function() {
        keys = undefined;
      });
    });
    waitsFor("cleanup keys", function() {
      return keys == undefined;
    }, TIMEOUT);
  });

  it("clears the store", function() {
    var p = proxy();
    var val = undefined;

    runs(function() {
      p.set('key', 'value').done(function() {
        p.clear().done(function() {
          p.keys().done(function(ret) {
            val = ret;
          });
        });
      });
    });
    waitsFor("keys to be set", function() {
      return val != undefined;
    }, TIMEOUT);
    runs(function() {
      expect(val.length).toEqual(0);
    });
  });

  it("shares data between different instances", function() {
    var p1 = proxy();
    var p2 = proxy();
    var isKeySet = false;
    var val = undefined;

    runs(function() {
      p1.set("key", "value").done(function() {
        isKeySet = true;
      });
    });
    waitsFor("keys should be set", function() {
      return isKeySet == true;
    }, TIMEOUT);
    runs(function() {
      p2.get("key").done(function(ret) {
        val = ret;
      });
    });
    waitsFor("keys retrieved", function() {
      return val != undefined;
    });
    runs(function() {
      expect(val).toEqual("value");
      p1.clear().done(function () {
        p2.clear().done(function () {
          val = undefined;
        });
      });
    });
    waitsFor("cleanup keys", function() {
      return val == undefined;
    }, TIMEOUT);

  
  });
});

