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
      src: freedom_src,
      debug: 'error'
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
    freedom.on('output', function(value) {
      expect(value).toEqual('roundtrip');
      done();
    });
    freedom.emit('input', 'roundtrip');
  });

  it("Creates child modules", function(done) {
    freedom.on('child-output', function(value) {
      expect(value).toEqual('child-roundtrip');
      done();
    });
    freedom.emit('child-input', 'child-roundtrip');
  });
  
  it("Handles manifest-defined APIs", function(done) {
    freedom.on('log', function(value) {
      var log = JSON.parse(value);
      expect(log[0][1]).toEqual('log Msg');
      expect(log[1][1]).toEqual('another Log');
      expect(log[1][0] - log[0][0]).toBeGreaterThan(-1);
      done();
    });
    freedom.emit('do-log', 'log Msg');
    freedom.emit('do-log', 'another Log');
    freedom.emit('get-log');
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
      stayLocal: true,
      debug: "error"
    });

    expect(freedom.on).toBeDefined();

    document.body.removeChild(script);
  });

  it("Requires Valid JSON", function() {
    var root = document.createElement('div');
    var script = document.createElement("script");
    script.setAttribute('data-manifest', "relative://spec/helper/manifest.json");
    var contents = document.createTextNode("var x = 2; //this is not json");
    script.appendChild(contents);
    root.appendChild(script);

    var global = {
      document: root,
      console: {
        error: function() {}
      }
    };
    
    freedomcfg = function() {
      spyOn(fdom.debug, 'error');
    };

    freedom = fdom.setup(global, undefined, {
      portType: 'Frame',
      inject: dir + "node_modules/es5-shim/es5-shim.js",
      src: freedom_src,
      advertise: true,
      debug: 'warn'
    });

    expect(fdom.debug.error).toHaveBeenCalled();

    root.removeChild(script);
  });
});
