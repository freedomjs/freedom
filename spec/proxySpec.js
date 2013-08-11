describe("fdom.Proxy", function() {
  var pipe;
  beforeEach(function() {
    pipe = fdom.Channel.pipe();
  });

  it("exposes a message channel", function() {
    spyOn(pipe[0], 'emit');
    var proxy = new fdom.Proxy(pipe[1]);
    proxy.emit('testEvent', 'testVal');

    expect(pipe[0].emit).toHaveBeenCalledWith('message', {
      action: 'event',
      type: 'testEvent',
      data: 'testVal'
    });

    var handler = jasmine.createSpy('callback');
    proxy.on('message', handler);
    pipe[0].postMessage({
      action: 'event',
      type: 'message',
      data: 'woot'
    });

    expect(handler).toHaveBeenCalledWith('woot');
  });

  it("exposes a defined API", function() {
    spyOn(pipe[0], 'emit');
    var proxy = new fdom.Proxy(pipe[1], {
      "myMethod": {type: "method"},
    });

    expect(proxy.myMethod).toBeDefined();
    proxy.myMethod();
    expect(pipe[0].emit).toHaveBeenCalled();
    expect(pipe[0].emit.mostRecentCall.args[1].type).toEqual('myMethod');
  });

  it("relays events", function() {
    spyOn(pipe[0], 'emit');
    var proxy = new fdom.Proxy(pipe[1], {
      "myEvent": {type: "event"},
    });

    expect(proxy.on).toBeDefined();
    var callback = jasmine.createSpy('callback');
    proxy.on('myEvent', callback);
    expect(callback).not.toHaveBeenCalled();
    // Get the flowId from when it was relayed over the channel at setup.
    var flow = pipe[0].emit.calls[0].args[1].flowId;
    pipe[0].postMessage({
      flowId: flow,
      action: 'event',
      type: 'myEvent',
      value: 'null'
    });
    expect(callback).toHaveBeenCalled();
  });

  describe("functionally", function() {
    var definition = {
      "myMethod": {type: "method"},
      "myEvent": {type: "event"}
    };
    var consumer, producer, spy;
    
    beforeEach(function() {
      producer = new fdom.Proxy(pipe[0], definition, true);
      spy = jasmine.createSpyObj('prod', ['myMethod']);
      producer.provideSynchronous(function() {return spy;});
      consumer = new fdom.Proxy(pipe[1], definition);
    });

    it("relays message calls", function() {
      consumer.myMethod();
      expect(spy.myMethod).toHaveBeenCalled();
    });

    it("relays events", function() {
      var ev = jasmine.createSpy('cb');
      consumer.on('myEvent', ev);
      expect(ev).not.toHaveBeenCalled();
      spy.dispatchEvent('myEvent', null);
      expect(ev).toHaveBeenCalled();
    });
  });
});
