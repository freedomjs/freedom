var Module = require('../../src/module');
var testUtil = require('../util');

describe("Module", function() {
  var module, link, port, policy;
  beforeEach(function(done) {
    policy = testUtil.createMockPolicy();
    module = new Module("manifest://{}", {}, [], policy);
    port = testUtil.createTestPort('messager');
    module.on('control', port.onMessage.bind(port, 'control'));
    module.on('extport', port.onMessage.bind(port, 'extport'));
    link = testUtil.createTestPort('modulelink');
    var test = function() {
      this.addErrorHandler = function() {};
      this.onMessage = link.onMessage.bind(link);
      this.on = link.on.bind(link);
      this.off = link.off.bind(link);
    };
    module.onMessage("control", {
      type: 'setup',
      channel: 'control',
      config: {
        portType: test
      }
    });
    setTimeout(done, 0);
  });
  
  it("Attempts Module Startup", function() {
    expect(link.gotMessage('control', {request: 'environment'})).not.toBeFalsy();
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