describe("fdom.Port.Proxy", function() {
  var port;
  beforeEach(function() {
    port = new fdom.port.Proxy(fdom.proxy.EventInterface);
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
    expect(spy.callCount).toEqual(2);
  });

  it("reports messages to the interface", function() {
    // setup.
    port.onMessage('default', {
      channel: 'message'
    });
    var iface = port.getInterface();
    var spy = jasmine.createSpy('cb');
    iface.on('message', spy);
    
    port.onMessage('default', {type:'message', message:'thing'});
    expect(spy).toHaveBeenCalledWith('thing');
  });
});
