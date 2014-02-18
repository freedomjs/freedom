describe("unit: social.ws.json", function () {
  var provider, de, ws;

  beforeEach(function() {
    // Comment for more debugging messages.
    spyOn(console, 'log');

    freedom = {
      social: mockIface([], [
        ['STATUS_NETWORK', fdom.apis.get("social").definition.STATUS_NETWORK.value],
        ['STATUS_CLIENT', fdom.apis.get("social").definition.STATUS_CLIENT.value]
      ])
    };

    jasmine.clock().install();
    de = jasmine.createSpy('dispatchEvent');
    var wsprov = function() {
      ws = this;
      this.close = jasmine.createSpy('close').and.callFake(function() {this.onclose();});
      this.send = jasmine.createSpy('send');
    };
    provider = new WSSocialProvider(de, wsprov);
  });
  
  afterEach(function() {
    jasmine.clock().uninstall();
  });
  
  it("emits offline at start", function() {
    jasmine.clock().tick(100);
    expect(provider.dispatchEvent).toHaveBeenCalled();
  });

  it("logs in", function() {
    var d = jasmine.createSpy("login");

    provider.login({}, d);
    expect(provider.dispatchEvent).toHaveBeenCalled();
    expect(provider.dispatchEvent).toHaveBeenCalledWith("onStatus", jasmine.any(Object));
    expect(d).not.toHaveBeenCalled();

    ws.onmessage({data: JSON.stringify({'cmd': 'state', 'id': 'yourId', 'msg':''})});
    
    expect(provider.dispatchEvent).toHaveBeenCalledWith("onChange", jasmine.any(Object));
    expect(d).toHaveBeenCalled();
  });

  it("can getRoster", function() {
    var d = jasmine.createSpy("getRoster");
    provider.login({}, function() {});
    ws.onmessage({data: JSON.stringify({'cmd': 'state', 'id': 'yourId', 'msg':['tom', 'bill']})});
    provider.getRoster(d);
    expect(d.calls.count()).toEqual(1);
    expect(d.calls.mostRecent().args.length).toBeGreaterThan(0);
    expect(d.calls.mostRecent().args[0]["tom"]).toBeDefined();
    expect(d.calls.mostRecent().args[0]["bill"]).toEqual({
      userId: "bill",
      name: "bill",
      clients: {"bill": {
        clientId: "bill",
        network: "websockets",
        status: freedom.social().STATUS_CLIENT["MESSAGEABLE"]
      }}
    });
  });

  it("logs out", function() {
    var d = jasmine.createSpy("logout");
    provider.login({}, function() {});
    provider.logout({}, d);
    expect(provider.dispatchEvent).toHaveBeenCalled();
    expect(d).toHaveBeenCalled();
    expect(d.calls.mostRecent().args[0].status).toEqual(
        freedom.social().STATUS_CLIENT["OFFLINE"]);
    expect(ws.close).toHaveBeenCalled();
  });

  it("echos messages", function() {
    var d = jasmine.createSpy("sendMessage");
    provider.login({}, function() {});
    ws.onmessage({data: JSON.stringify({'cmd': 'state', 'id': 'yourId', 'msg':['tom', 'bill']})});
    provider.sendMessage("tom", "Hello World", d);
    expect(ws.send).toHaveBeenCalled();
    expect(d).toHaveBeenCalled();

    ws.onmessage({data: JSON.stringify({'cmd': 'message', 'from':'tom', 'msg':'hello'})});
    expect(provider.dispatchEvent).toHaveBeenCalled();
  });
});


