var testUtil = require('../../util');
var Provider = require('../../../providers/social/loopback/social.loopback');

describe("unit: social.loopback.json", function () {
  var provider;

  beforeEach(function() {
    // Comment for more debugging messages.
    spyOn(console, 'log');
    
    var social = testUtil.getApis().get("social").definition;

    freedom = function() {
      return testUtil.mockIface([], [
        ['STATUS', social.STATUS.value],
        ['ERRCODE', social.ERRCODE.value]
      ])
    };

    provider = new Provider.provider(jasmine.createSpy('dispatchEvent'));
  });
  
  afterEach(function() {
  });
 
  it("logs in", function() {
    var d = jasmine.createSpy("login");
    var expectedResult = {
      userId: "Test User",
      clientId: "Test User.0",
      status: "ONLINE",
      lastUpdated: jasmine.any(Number),
      lastSeen: jasmine.any(Number)
    };
    provider.login({}, d);
    expect(d).toHaveBeenCalled();
    expect(d).toHaveBeenCalledWith(expectedResult);
    expect(provider.dispatchEvent).toHaveBeenCalled();
    expect(provider.dispatchEvent).toHaveBeenCalledWith("onClientState", expectedResult);
    expect(provider.dispatchEvent).toHaveBeenCalledWith("onClientState", {
      userId: "Other User",
      clientId: "Other User.0",
      status: "ONLINE",
      lastUpdated: jasmine.any(Number),
      lastSeen: jasmine.any(Number)
    });
    expect(provider.dispatchEvent).toHaveBeenCalledWith("onUserProfile", {
      userId: "Test User",
      name: "Test User",
      lastUpdated: jasmine.any(Number)
    });
    expect(provider.dispatchEvent).toHaveBeenCalledWith("onUserProfile", {
      userId: "Other User",
      name: "Other User",
      lastUpdated: jasmine.any(Number)
    });
  });

  it("can getClients", function() {
    var d = jasmine.createSpy("getClients");
    provider.login({}, function() {});
    provider.getClients(d);
    expect(d.calls.count()).toEqual(1);
    expect(d.calls.mostRecent().args.length).toBeGreaterThan(0);
    expect(d.calls.mostRecent().args[0]["Test User.0"]).toBeDefined();
    expect(d.calls.mostRecent().args[0]["Test User.0"]).toEqual({
      userId: "Test User",
      clientId: "Test User.0",
      status: "ONLINE",
      lastUpdated: jasmine.any(Number),
      lastSeen: jasmine.any(Number)
    });
    expect(d.calls.mostRecent().args[0]["Other User.0"]).toBeDefined();
    expect(d.calls.mostRecent().args[0]["Other User.0"]).toEqual({
      userId: "Other User",
      clientId: "Other User.0",
      status: "ONLINE",
      lastUpdated: jasmine.any(Number),
      lastSeen: jasmine.any(Number)
    });
  });

  it("can getUsers", function() {
    var d = jasmine.createSpy("getUsers");
    provider.login({}, function() {});
    provider.getUsers(d);
    expect(d.calls.count()).toEqual(1);
    expect(d.calls.mostRecent().args.length).toBeGreaterThan(0);
    expect(d.calls.mostRecent().args[0]["Test User"]).toBeDefined();
    expect(d.calls.mostRecent().args[0]["Test User"]).toEqual({
      userId: "Test User",
      name: "Test User",
      lastUpdated: jasmine.any(Number)
    });
    expect(d.calls.mostRecent().args[0]["Other User"]).toBeDefined();
    expect(d.calls.mostRecent().args[0]["Other User"]).toEqual({
      userId: "Other User",
      name: "Other User",
      lastUpdated: jasmine.any(Number)
    });
  });

  it("logs out", function() {
    var d = jasmine.createSpy("logout");
    provider.login({}, function() {});
    provider.logout(d);
    expect(d).toHaveBeenCalled();
    expect(provider.dispatchEvent).toHaveBeenCalled();
    expect(provider.dispatchEvent).toHaveBeenCalledWith("onClientState", {
      userId: "Test User",
      clientId: "Test User.0",
      status: "OFFLINE",
      lastUpdated: jasmine.any(Number),
      lastSeen: jasmine.any(Number)
    });
    expect(provider.dispatchEvent).toHaveBeenCalledWith("onClientState", {
      userId: "Other User",
      clientId: "Other User.0",
      status: "OFFLINE",
      lastUpdated: jasmine.any(Number),
      lastSeen: jasmine.any(Number)
    });
  
  });

  it("echos messages", function() {
    var d = jasmine.createSpy("sendMessage");
    provider.login({}, function() {});
    provider.sendMessage("Other User", "Hello World", d);
    expect(d).toHaveBeenCalled();
    expect(provider.dispatchEvent).toHaveBeenCalled();
    expect(provider.dispatchEvent).toHaveBeenCalledWith("onMessage", {
      from: {
        userId: "Other User",
        clientId: "Other User.0",
        status: "ONLINE",
        lastUpdated: jasmine.any(Number),
        lastSeen: jasmine.any(Number)
      },
      message: "Hello World"
    });
  });


});


