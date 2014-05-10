describe("freedom", function() {
  var freedom_src;

  var freedom, dir;
  beforeEach(function() {
    freedom_src = getFreedomSource();
    var global = {
      console: {
        log: function() {}
      },
      document: document
    };
    setupResolvers();
    
    var path = window.location.href,
        dir_idx = path.lastIndexOf('/');
    dir = path.substr(0, dir_idx) + '/';
    freedom = fdom.setup(global, undefined, {
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
    freedom = null;
  });

  it("creates modules", function(done) {
    var cb = jasmine.createSpy('cb');
    var called = false;
    freedom.on('output', cb);
    freedom.on('output', function() {
      expect(cb).toHaveBeenCalledWith('roundtrip');
      done();
    });
    freedom.emit('input', 'roundtrip');
  });

  it("Can be configured in a self-contained way", function() {
    var script = document.createElement("script");
    script.setAttribute('data-manifest', "relative://spec/helper/manifest.json");
    script.innerText = "{}";
    document.body.appendChild(script);

    var global = {
      document: document
    };

    freedom = fdom.setup(global, undefined, {
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

    var global = {
      document: document
    };
    freedomcfg = function() {
      spyOn(fdom.debug, 'warn');
    }

    freedom = fdom.setup(global, undefined, {
      portType: 'Frame',
      inject: dir + "node_modules/es5-shim/es5-shim.js",
      src: freedom_src,
      advertise: true
    });

    expect(fdom.debug.warn).toHaveBeenCalled();

    document.body.removeChild(script);
  });
});
