describe("freedom", function() {
  var xhr = new XMLHttpRequest();
  xhr.open("get", "freedom.js", false);
  xhr.overrideMimeType("text/javascript; charset=utf-8");
  xhr.send(null);
  var freedom_src = xhr.responseText;

  var freedom, dir;
  beforeEach(function() {
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
    freedom = setup(global, undefined, {
      manifest: "relative://spec/helper/manifest.json",
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

  it("creates modules", function() {
    var cb = jasmine.createSpy('cb');
    var called = false;
    runs(function() {
      freedom.on('output', cb);
      freedom.on('output', function() {
        called = true;
      });
      freedom.emit('input', 'roundtrip');
    });

    waitsFor(function() {
      return called;
    }, "Freedom should return input", 4000);

    runs(function() {
      expect(cb).toHaveBeenCalledWith('roundtrip');
    });
  });

  it("Can be configured in a self-contained way", function() {
    var script = document.createElement("script");
    script.setAttribute('data-manifest', "relative://spec/helper/manifest.json");
    script.innerText = "{}";
    document.body.appendChild(script);

    var global = {};

    freedom = setup(global, undefined, {
      portType: 'Frame',
      inject: dir + "node_modules/es5-shim/es5-shim.js",
      src: freedom_src,
      stayLocal: true
    });

    expect(freedom.on).toBeDefined();

    document.body.removeChild(script);
  });

  it("Requires Valid JSON", function() {
    var script = document.createElement("script");
    script.setAttribute('data-manifest', "relative://spec/helper/manifest.json");
    script.innerText = "var x = 2; //this is not json";
    document.body.appendChild(script);

    var global = {};
    freedomcfg = function() {
      spyOn(fdom.debug, 'warn');
    }

    freedom = setup(global, undefined, {
      portType: 'Frame',
      inject: dir + "node_modules/es5-shim/es5-shim.js",
      src: freedom_src,
      advertise: true
    });

    expect(fdom.debug.warn).toHaveBeenCalled();

    document.body.removeChild(script);
  });
});
