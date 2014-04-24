describe("fdom.port.Module", function() {
  var module, link, port;
  beforeEach(function(done) {
    module = new fdom.port.Module("manifest://{}", {}, []);
    port = createTestPort('messager');
    module.on('control', port.onMessage.bind(port, 'control'));
    module.on('extport', port.onMessage.bind(port, 'extport'));
    link = createTestPort('modulelink');
    fdom.link.test = function() {
      this.onMessage = link.onMessage.bind(link);
      this.on = link.on.bind(link);
      this.off = link.off.bind(link);
    };
    module.onMessage("control", {
      type: 'setup',
      channel: 'control',
      config: {
        portType: 'test'
      }
    });
    setTimeout(done, 0);
  });
  
  afterEach(function() {
    delete fdom.link.test;
  });

  it("Attempts Module Startup", function() {
    expect(link.gotMessage('control', {request: 'port'}).service).toEqual("ModuleInternal");
  });

  it("Maps flows between inner and outer hub", function() {
    // Link the core
    var spy = jasmine.createSpy('coremsg');
    var core = function() {
      this.onMessage = spy;
    };
    module.onMessage('control', {
      core: core
    });
    
    // Pretend the module has started.
    link.emit('ModInternal', {
      type: 'ready'
    });

    // Request to register a port. via a 'core' api call.
    link.emit('control', {
      flow: 'core',
      message: {
        type: 'register',
        id: 'newport'
      }
    });
    expect(spy).toHaveBeenCalledWith(module, {
      type: 'register',
      id: 'newport',
      reply: jasmine.any(Function)
    });
    // Respond as if binding has occured
    module.onMessage('control', {
      type: 'createLink',
      channel: 'extport',
      name: 'newport'
    });
    // Internal Mapping
    link.emit('control', {
      type: 'createLink',
      channel: 'intport',
      name: 'newport'
    });
    // Make sure messages now translate both ways.
    module.onMessage('newport', 'ingoing msg');
    expect(link.gotMessage('intport', 'ingoing msg')).not.toBeFalsy();

    link.emit('newport', 'outgoing msg');
    expect(port.gotMessage('extport', 'outgoing msg')).not.toBeFalsy();

    // Tear Down.
    module.onMessage('control', {
      type: 'close',
      channel: 'extport'
    });
    expect(link.gotMessage('control', {type: 'close'})).not.toBeFalsy();
  });
});