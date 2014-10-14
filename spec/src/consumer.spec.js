var Consumer = require('../../src/consumer');
var EventInterface = require('../../src/proxy/eventInterface');

describe("Consumer", function() {
  var port;
  beforeEach(function() {
    port = new Consumer(EventInterface);
  });

  it("reports messages back to the port", function() {
    var iface = port.getInterface();
    expect(iface.on).toBeDefined();
    var spy = jasmine.createSpy('cb');
    port.on('message', spy);

    // setup.
    port.onMessage('default', {
      channel: 'message'
    });
    expect(spy).not.toHaveBeenCalled();

    // existing interfaces now work.
    iface.emit('hi', 'msg');
    expect(spy).toHaveBeenCalled();
    
    // New interfaces also will.
    iface = port.getInterface();
    iface.emit('hi', 'msg');
    expect(spy.calls.count()).toEqual(2);
  });

  it("reports messages to the interface", function() {
    // setup.
    port.onMessage('default', {
      channel: 'message'
    });
    var iface = port.getInterface();
    var spy = jasmine.createSpy('cb');
    iface.on('message', spy);
    
    port.onMessage('default', {type:'message', message:{type:'message', message: 'thing'}});
    expect(spy).toHaveBeenCalledWith('thing');
  });
  
  it("sends constructor arguments to appropriate interface", function() {
    var arg = undefined;
    var myInterface = function(onMsg, emit, debug, x) {
      arg = x;
    };
    // setup.
    port = new Consumer(myInterface);

    port.onMessage('default', {
      channel: 'message'
    });
    var iface = port.getInterface('arg1');
    expect(arg).toEqual('arg1');

    arg = undefined;
    var proxy = port.getProxyInterface();
    proxy('arg1');
    expect(arg).toEqual('arg1');
  });

  it("closes the interface when asked", function() {
    // setup.
    port.onMessage('control', {
      type: 'setup',
      channel: 'control'
    });
    port.onMessage('default', {
      channel: 'message'
    });
    var spy = jasmine.createSpy('cb');
    port.on('message', spy);
    var closeSpy = jasmine.createSpy('close');
    port.on('control', closeSpy);

    var publicProxy = port.getProxyInterface();
    var iface = publicProxy();
    iface.emit('hi', 'msg');

    expect(spy).toHaveBeenCalled();
    publicProxy.close();
    iface.emit('hi', 'msg');
    expect(spy.calls.count()).toEqual(1);
    expect(closeSpy).toHaveBeenCalled();
    expect(closeSpy.calls.argsFor(0)[0].request).toEqual('close');
  });

  it("reports errors when they occur", function() {
    // setup.
    port.onMessage('control', {
      type: 'setup',
      channel: 'control'
    });
    port.onMessage('default', {
      channel: 'message'
    });
    var spy = jasmine.createSpy('msg');
    var espy = jasmine.createSpy('cb');
    port.on('message', spy);

    var publicProxy = port.getProxyInterface();
    var iface = publicProxy();
    publicProxy.onError(espy);
    iface.emit('hi', 'msg');
    expect(spy).toHaveBeenCalled();

    expect(espy).not.toHaveBeenCalled();
    port.onMessage('default', {
      type: 'error',
      to: false,
      message: 'msg'
    });
    expect(espy).toHaveBeenCalled();
  });
});
