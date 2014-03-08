describe("unit: social.ws.json", function () {
  var provider, de, ws;

  beforeEach(function() {
    // Comment for more debugging messages.
    spyOn(console, 'log');

    freedom = {
      social: mockIface([], [
        ['STATUS', fdom.apis.get("social").definition.STATUS.value]
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
  
  it("logs in", function() {
    var d = jasmine.createSpy("login");
    var expectedResult = {
      userId: "yourId",
      clientId: "yourId",
      status: freedom.social().STATUS["ONLINE"],
      timestamp: jasmine.any(Number)
    };

    provider.login({}, d);
    expect(d).not.toHaveBeenCalled();

    ws.onmessage({data: JSON.stringify({'cmd': 'state', 'id': 'yourId', 'msg':''})});
    
    expect(provider.dispatchEvent).toHaveBeenCalledWith("onClientState", expectedResult);
    expect(d).toHaveBeenCalledWith(expectedResult, undefined);
  });

  it("can getClients", function() {
    var d = jasmine.createSpy("getRoster");
    provider.login({}, function() {});
    ws.onmessage({data: JSON.stringify({'cmd': 'state', 'id': 'yourId', 'msg':['tom', 'bill']})});
    provider.getClients(d);
    expect(d.calls.count()).toEqual(1);
    expect(d.calls.mostRecent().args.length).toBeGreaterThan(0);
    expect(d.calls.mostRecent().args[0]["tom"]).toBeDefined();
    expect(d.calls.mostRecent().args[0]["bill"]).toEqual({
      userId: "bill",
      clientId: "bill",
      status: freedom.social().STATUS["ONLINE"],
      timestamp: jasmine.any(Number)
    });
  });

  it("can getUsers", function() {
    var d = jasmine.createSpy("getRoster");
    provider.login({}, function() {});
    ws.onmessage({data: JSON.stringify({'cmd': 'state', 'id': 'yourId', 'msg':['tom', 'bill']})});
    provider.getUsers(d);
    expect(d.calls.count()).toEqual(1);
    expect(d.calls.mostRecent().args.length).toBeGreaterThan(0);
    expect(d.calls.mostRecent().args[0]["tom"]).toBeDefined();
    expect(d.calls.mostRecent().args[0]["bill"]).toEqual({
      userId: "bill",
      name: "bill",
      timestamp: jasmine.any(Number)
    });
  });


  it("logs out", function() {
    var d = jasmine.createSpy("logout");
    provider.login({}, function() {});
    provider.logout({}, d);
    expect(d).toHaveBeenCalled();
    expect(provider.dispatchEvent).toHaveBeenCalledWith("onClientState", jasmine.objectContaining({
      status: freedom.social().STATUS["OFFLINE"]
    }));
    expect(ws.close).toHaveBeenCalled();
  });

  it("echos messages", function() {
    var d = jasmine.createSpy("sendMessage");
    provider.login({}, function() {});
    ws.onmessage({data: JSON.stringify({'cmd': 'state', 'id': 'yourId', 'msg':['tom', 'bill']})});
    provider.sendMessage("tom", "Hello World", d);
    expect(ws.send).toHaveBeenCalledWith(jasmine.any(String));
    expect(d).toHaveBeenCalled();

    ws.onmessage({data: JSON.stringify({'cmd': 'message', 'from':'tom', 'msg':'hello'})});
    expect(provider.dispatchEvent).toHaveBeenCalledWith("onMessage", {
      from: {
        userId: "tom",
        clientId: "tom",
        status: freedom.social().STATUS["ONLINE"],
        timestamp: jasmine.any(Number)
      },
      to: {
        userId: "yourId",
        clientId: "yourId",
        status: freedom.social().STATUS["ONLINE"],
        timestamp: jasmine.any(Number)
      },
      message: "hello"
    });
  });
});


