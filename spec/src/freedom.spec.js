var entry = require('../../src/entry');
var Frame = require('../../src/link/frame');
var testUtil = require('../util');

describe("freedom", function() {
  var freedom, dir;
  beforeEach(function() {
    var global = {
      document: document
    };
    
    var path = window.location.href,
        dir_idx = path.lastIndexOf('/');
    dir = path.substr(0, dir_idx) + '/';
    freedom = entry({
      'global': global,
      'providers': [
        require('../../providers/core/core.unprivileged'),
        require('../../providers/core/logger.console')
      ],
      'resolvers': testUtil.getResolvers(),
      'portType': Frame,
      'source': dir + "frame.js",
      'inject': dir + "node_modules/es5-shim/es5-shim.js",
    }, "relative://spec/helper/manifest.json", {
      debug: 'debug'
    });
  });
  
  afterEach(function() {
    var frames = document.getElementsByTagName('iframe');
    for (var i = 0; i < frames.length; i++) {
      frames[i].parentNode.removeChild(frames[i]);
    }
    freedom = null;
  });

  iit("creates modules", function(done) {
    freedom.then(function(iface) {
      console.warn('interface made');
      var app = iface();
      app.on('output', function(value) {
        expect(value).toEqual('roundtrip');
        done();
      });
      app.emit('input', 'roundtrip');
    });
  });

  it("Creates child modules", function(done) {
    freedom.then(function(iface) {
      var app = iface();
      app.on('child-output', function(value) {
        expect(value).toEqual('child-roundtrip');
        done();
      });
      app.emit('child-input', 'child-roundtrip');
    });
  });
  
  it("Handles manifest-defined APIs", function(done) {
    freedom.then(function(iface) {
      var app = iface();
      app.on('log', function(value) {
        var log = JSON.parse(value);
        expect(log[0][1]).toEqual('log Msg');
        expect(log[1][1]).toEqual('another Log');
        expect(log[1][0] - log[0][0]).toBeGreaterThan(-1);
        done();
      });
      app.emit('do-log', 'log Msg');
      app.emit('do-log', 'another Log');
      app.emit('get-log');
    });
  });
});
