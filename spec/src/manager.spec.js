describe("fdom.Port.Manager", function() {
  var hub, manager, port;

  beforeEach(function() {
    hub = new fdom.Hub();
    fdom.debug = new fdom.port.Debug();
    manager = new fdom.port.Manager(hub);
    var global = {
      console: {
        log: function() {}
      }
    };
    hub.emit('config', {
      global: global,
      debug: true
    });
    port = createTestPort('testing');
    manager.setup(port);
  });

  it("Handles Debug Messages", function() {
    spyOn(fdom.debug, 'print');
    manager.onMessage('testing', {
      request: 'debug'
    });
    expect(fdom.debug.print).toHaveBeenCalled();
    manager.onMessage('unregistered', {
      request: 'debug'
    });
    expect(fdom.debug.print.calls.count()).toEqual(1);
  });

  it("Creates Links", function() {
    var testPort = createTestPort('dest');

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

  it("Creates new ports", function() {
    manager.onMessage('testing', {
      request: 'port',
      name: 'testPort',
      service: 'Debug',
      args: null
    });

    // Notification of link.
    var notification = port.gotMessage('control', {type: 'createLink'});
    expect(notification).not.toEqual(false);
  });

  it("Supports delegation of control", function() {
    var testPort = createTestPort('dest');

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
    expect(fdom.resources.contentRetreivers['testing']).toEqual('resolver');

    // Reset resources
    fdom.resources = new Resource();
  });

  it("Provides singleton access to the Core API", function(done) {
    manager.onMessage('testing', {
      request: 'core'
    });
    setTimeout(function() {
      var response = port.gotMessage('control', {type: 'core'});
      expect(response).not.toEqual(false);
      var core = response.core;

      var otherPort = createTestPort('dest');
      manager.setup(otherPort);
      manager.onMessage('dest', {
        request: 'core'
      });

      var otherResponse = otherPort.gotMessage('control', {type: 'core'});
      expect(otherResponse.core).toEqual(core);
      done();
    }, 0);
  });

  it("Tears down Ports", function() {
    manager.onMessage('testing', {
      request: 'close'
    });

    // Subsequent requests should fail / cause a warning.
    spyOn(fdom.debug, 'warn');
    manager.onMessage('testing', {
      request: 'core'
    });
    expect(fdom.debug.warn).toHaveBeenCalled();
    expect(port.gotMessage('control', {type: 'core'})).toEqual(false);
  });
});
