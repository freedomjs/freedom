var Debug = require('../../../src/debug');
var Hub = require('../../../src/hub');
var Resource = require('../../../src/resource');
var Api = require('../../../src/api');
var Bundle = require('../../../src/bundle');
var Manager = require('../../../src/manager');
var Core = require('../../../providers/core/core.unprivileged');
var testUtil = require('../../util');

describe("Core Provider Integration", function() {
  var freedom;
  beforeEach(function(done) {
    testUtil.setCoreProviders([
      Core
    ]);
    testUtil.setupModule('relative://spec/helper/channel.json').then(function(iface) {
      freedom = iface();
      done();
    });
  });
  
  afterEach(function() {
    testUtil.cleanupIframes();
  });

  it("Manages Channels Between Modules", function(done) {
    var cb = jasmine.createSpy('cb');
    freedom.once('message', function(msg) {
      // created.
      expect(msg).toEqual('creating custom channel 0');
      freedom.on('message', cb);
      freedom.on('message', function() {
        expect(cb).toHaveBeenCalledWith('sending message to 0');
        if (cb.calls.count() == 3) {
          expect(cb).toHaveBeenCalledWith('channel 0 replies Message to chan 0');
          done();
        }
      });
      freedom.emit('message', 0);
    });
    freedom.emit('create');
  });

  it("Manages Channels With providers", function(done) {
    var cb = jasmine.createSpy('cb');
    freedom.once('message', function(msg) {
      // created.
      freedom.on('message', cb);
      freedom.once('message', function() {
        expect(cb).toHaveBeenCalledWith('sending message to peer 0');
        done();
      });
      freedom.emit('message', 0);
    });
    freedom.emit('peer');
  });
});

describe("Core Provider Channels", function() {
  var manager, hub, global, source, core;
  
  beforeEach(function(done) {
    var debug = new Debug(),
      hub = new Hub(debug),
      resource = new Resource(debug),
      api = new Api(debug),
      manager = new Manager(hub, resource, api),
      source = testUtil.createTestPort('test');
    Bundle.register([{
      'name': 'core',
      'provider': Core.provider
    }], api);

    hub.emit('config', {
      global: {}
    });
    manager.setup(source);

    var chan = source.gotMessage('control').channel;
    hub.onMessage(chan, {
      type: 'Core Provider',
      request: 'core'
    });
    
    source.gotMessageAsync('control', {type: 'core'}, function(response) {
      core = response.core;
      done();
    });
  });

  it('Links Custom Channels', function() {
    expect(core).toBeDefined();

    var c = new core(), id, input;
    var call = c.createChannel(function(chan) {
      id = chan.identifier;
      input = chan.channel;
    });
    expect(input).toBeDefined();
    
    var inHandle = jasmine.createSpy('input');
    input.on(inHandle);
    expect(inHandle).not.toHaveBeenCalled();

    var output;
    c.bindChannel(id, function(chan) {
      output = chan;
    });
    expect(output).toBeDefined();
    
    expect(inHandle).not.toHaveBeenCalled();
    output.emit('message', 'whoo!');
    expect(inHandle).toHaveBeenCalled();
  });


  it('Supports Custom Channel Closing', function() {
    var c = new core(), id, input;
    var call = c.createChannel(function(chan) {
      id = chan.identifier;
      input = chan.channel;
    });
    expect(input).toBeDefined();
    
    var handle = jasmine.createSpy('message');

    var output;
    c.bindChannel(id, function(chan) {
      output = chan;
    });
    expect(output).toBeDefined();
    output.on(handle);

    var closer = jasmine.createSpy('close');
    input.onClose(closer);
    expect(handle).not.toHaveBeenCalled();
    input.emit('message', 'whoo!');
    expect(handle).toHaveBeenCalledWith('message', 'whoo!');
    expect(closer).not.toHaveBeenCalled();
    output.close();
    expect(closer).toHaveBeenCalled();
  });

  it('Manages Module Identifiers', function() {
    var c = new core();
    c.setId(['a','b','c']);
    
    var spy = jasmine.createSpy('id');
    c.getId(spy);
    expect(spy).toHaveBeenCalledWith(['a','b','c']);
  });
});
