var Debug = require('../../src/debug');
var Policy = require('../../src/policy');
var Resource = require('../../src/resource');
var util = require('../../src/util');

describe('Policy', function() {
  var policy,
      manager;
  beforeEach(function() {
    manager = {debug: new Debug()};
    util.handleEvents(manager);
    manager.getPort = function(id) {
      return {
        id: id
      };
    };
    var rsrc = new Resource();
    policy = new Policy(manager, rsrc, {});
  });
  
  it('Generates new modules when needed', function(done) {
    var manifest = {
      constraints: {
        isolation: "never"
      }
    };
    var manifestURL = "manifest://" + JSON.stringify(manifest);
    policy.get([], manifestURL).then(function(mod) {
      manager.emit('moduleAdd', {lineage:[manifestURL], id:mod.id});
      policy.get([], manifestURL).then(function(mod2) {
        expect(mod2.id).toEqual(mod.id);
        done();
      });
    });
  });
  
  xit('Finds an appropriate runtime to place new modules', function() {
    //TODO: need to understand actual policy for multiple runtimes better.
  });
  
  it('Detects if a module is running in a runtime', function() {
    manager.emit('moduleAdd', {lineage:['test','a','b','c'], id:'test1'});
    manager.emit('moduleAdd', {lineage:['test','a','d1','e2'], id:'test2'});

    expect(policy.isRunning(policy.runtimes[0], 'test', [], false)).toEqual('test1');
    expect(policy.isRunning(policy.runtimes[0], 'test', ['a','b','c'], true)).toEqual('test1');
    expect(policy.isRunning(policy.runtimes[0], 'test', ['a','b','e'], true)).toEqual(false);
    expect(policy.isRunning(policy.runtimes[0], 'test', ['a','d','e'], true)).toEqual('test2');
  });
  
  it('Loads Manifests', function(done) {
    policy.loadManifest('manifest://{"x":"y"}').then(function(manifest) {
      expect(manifest.x).toEqual('y');
      done();
    });
  });

  it('Keeps track of running modules', function() {
    var port2 = {};
    util.handleEvents(port2);
    policy.add(port2, {});
    port2.emit('moduleAdd', {lineage:['test'], id:'test'});
    expect(policy.isRunning(policy.runtimes[1], 'test', [], false)).toEqual('test');
    port2.emit('moduleRemove', {lineage:['test'], id:'test'});
    expect(policy.isRunning(policy.runtimes[1], 'test', [], false)).toEqual(false);
  });

  it('Overlays policy / config', function() {
    var customPolicy = {
      background: true,
      interactive: false,
      custom: true
    };
    expect(policy.overlay(policy.defaultPolicy, customPolicy)).toEqual(customPolicy);

    var nullPolicy = {};
    expect(policy.overlay(policy.defaultPolicy, nullPolicy)).toEqual(policy.defaultPolicy);
  });
});