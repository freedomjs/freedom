describe("unit: social.loopback.json", function () {
  var provider;

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
    provider = new LoopbackSocialProvider(jasmine.createSpy('dispatchEvent'));
  });
  
  afterEach(function() {
    jasmine.clock().uninstall();
  });
  
  it("emits offline at start", function() {
    jasmine.clock().tick(100);
    expect(provider.dispatchEvent).toHaveBeenCalled();
    expect(provider.dispatchEvent).toHaveBeenCalledWith("onStatus", {
      network: "loopback",
      userId: "Test User",
      clientId: "Test User.0",
      status: freedom.social().STATUS_NETWORK["OFFLINE"],
      message: "Woo!"
    });
  });

  it("logs in", function() {
    var d = jasmine.createSpy("login");
    var expectedResult = {
      network: "loopback",
      userId: "Test User",
      clientId: "Test User.0",
      status: freedom.social().STATUS_NETWORK["ONLINE"],
      message: "Woo!"
    };
    provider.login({}, d);
    expect(provider.dispatchEvent).toHaveBeenCalled();
    expect(provider.dispatchEvent).toHaveBeenCalledWith("onStatus", expectedResult);
    expect(provider.dispatchEvent).toHaveBeenCalledWith("onChange", {
      userId: "Other User",
      name: "Other User",
      clients: { "Other User.0": {
        clientId: "Other User.0",
        network: "loopback",
        status: freedom.social().STATUS_CLIENT["MESSAGEABLE"]
      }}
    });
    expect(d).toHaveBeenCalled();
    expect(d).toHaveBeenCalledWith(expectedResult);
  });

  it("can getRoster", function() {
    var d = jasmine.createSpy("getRoster");
    provider.login({}, function() {});
    provider.getRoster(d);
    expect(d.calls.count()).toEqual(1);
    expect(d.calls.mostRecent().args.length).toBeGreaterThan(0);
    expect(d.calls.mostRecent().args[0]["Other User"]).toBeDefined();
    expect(d.calls.mostRecent().args[0]["Other User"]).toEqual({
      userId: "Other User",
      name: "Other User",
      clients: {"Other User.0": {
        clientId: "Other User.0",
        network: "loopback",
        status: freedom.social().STATUS_CLIENT["MESSAGEABLE"]
      }}
    });
  });

  it("logs out", function() {
    var d = jasmine.createSpy("logout");
    var expectedResult = {
      network: "loopback",
      userId: "Test User",
      clientId: "Test User.0",
      status: freedom.social().STATUS_NETWORK["OFFLINE"],
      message: "Woo!"
    };
    provider.login({}, function() {});
    provider.logout({}, d);
    expect(provider.dispatchEvent).toHaveBeenCalled();
    expect(provider.dispatchEvent).toHaveBeenCalledWith("onStatus", expectedResult);
    expect(provider.dispatchEvent).toHaveBeenCalledWith("onChange", {
      userId: "Other User",
      name: "Other User",
      clients: {}
    });
    expect(d).toHaveBeenCalled();
    expect(d).toHaveBeenCalledWith(expectedResult);
  
  });

  it("echos messages", function() {
    var d = jasmine.createSpy("sendMessage");
    provider.login({}, function() {});
    provider.sendMessage("Other User", "Hello World", d);
    expect(provider.dispatchEvent).toHaveBeenCalled();
    expect(provider.dispatchEvent).toHaveBeenCalledWith("onMessage", {
      fromUserId: "Other User",
      fromClientId: "Other User.0",
      toUserId: "Test User",
      toClientId: "Test User.0",
      network: "loopback",
      message: "Hello World"
    });
    expect(d).toHaveBeenCalled();
  });


});


