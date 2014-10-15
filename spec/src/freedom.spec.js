var testUtil = require('../util');

describe("freedom", function() {
  var freedom;
  beforeEach(function() {
    testUtil.setCoreProviders([
      require('../../providers/core/core.unprivileged'),
      require('../../providers/core/console.unprivileged')
    ]);
    freedom = testUtil.setupModule("relative://spec/helper/manifest.json");
  });
  
  afterEach(function() {
    testUtil.cleanupIframes();
    freedom = null;
  });

  it("creates modules", function(done) {
    freedom.then(function(iface) {
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
