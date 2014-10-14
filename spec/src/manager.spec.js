var Debug = require('../../src/debug');
var Hub = require('../../src/hub');
var Manager = require('../../src/manager');
var Resource = require('../../src/resource');
var Api = require('../../src/api');

var testUtil = require('../util');

describe("Manager", function() {
  var debug, hub, manager, port, resource, api;

  beforeEach(function() {
    debug = new Debug();
    hub = new Hub(debug);
    resource = new Resource(debug);
    api = new Api(debug);
    api.set('core',{});
    api.register('core',function() {});
    manager = new Manager(hub, resource, api);
    var global = {};

    hub.emit('config', {
      global: global,
      debug: true
    });
    port = testUtil.createTestPort('testing');
    manager.setup(port);
  });

  it("Handles Debug Messages", function() {
    spyOn(debug, 'print');
    manager.onMessage('testing', {
      request: 'debug'
    });
    expect(debug.print).toHaveBeenCalled();
    manager.onMessage('unregistered', {
      request: 'debug'
    });
    expect(debug.print.calls.count()).toEqual(1);
  });

  it("Creates Links", function() {
    var testPort = testUtil.createTestPort('dest');

    manager.onMessage('testing', {
      request: 'link',
      name: 'testLink',
      to: testPort
    });
    // Setup message.
    expect(testPort.gotMessage('control')).not.toEqual(false);
    // Notification of link.
    var notification = port.gotMessage('control', {type: 'createLink'});
    expect(notification).not.toEqual(false);

    // Forward link is 'default'.
    var msg = {contents: "hi!"};
    port.emit(notification.channel, msg);
    expect(testPort.gotMessage('default')).toEqual(msg);

    // Backwards link should be 'testLink'.
    testPort.emit(notification.reverse, msg);
    expect(port.gotMessage('testLink')).toEqual(msg);
  });

  it("Supports delegation of control", function() {
    var testPort = testUtil.createTestPort('dest');

    manager.setup(testPort);

    // Delegate messages from the new port to our port.
    manager.onMessage('testing', {
      request: 'delegate',
      flow: 'dest'
    });

    // Send a message from the new port.
    manager.onMessage('dest', {
      contents: 'hi!'
    });

    var notification = port.gotMessage('control', {type: 'Delegation'});
    expect(notification).not.toEqual(false);
    expect(notification.flow).toEqual('dest');
    expect(notification.message.contents).toEqual('hi!');
  });

  it("Registers resource resolvers", function() {
    manager.onMessage('testing', {
      request: 'resource',
      service: 'testing',
      args: ['retriever', 'resolver']
    });
    expect(resource.contentRetrievers['testing']).toEqual('resolver');
  });

  it("Provides singleton access to the Core API", function(done) {
    manager.onMessage('testing', {
      request: 'core'
    });
    port.gotMessageAsync('control', {type: 'core'}, function(response) {
      expect(response).not.toEqual(false);
      var core = response.core;

      var otherPort = testUtil.createTestPort('dest');
      manager.setup(otherPort);
      manager.onMessage('dest', {
        request: 'core'
      });
      
      otherPort.gotMessageAsync('control', {type: 'core'}, function(otherResponse) {
        expect(otherResponse.core).toEqual(core);
        done();
      });
    });
  });

  it("Tears down Ports", function() {
    manager.onMessage('testing', {
      request: 'close'
    });

    // Subsequent requests should fail / cause a warning.
    spyOn(debug, 'warn');
    manager.onMessage('testing', {
      request: 'core'
    });
    expect(debug.warn).toHaveBeenCalled();
    expect(port.gotMessage('control', {type: 'core'})).toEqual(false);
  });

  it("Retreives Ports by ID", function() {
    expect(manager.getPort(port.id)).toEqual(port);
  });
});
