var testUtil = require('../../util');
var Provider = require('../../../providers/social/websocket-server/social.ws');

describe("unit: social.ws.json", function () {
  var provider, de, ws;

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

    jasmine.clock().install();
    de = jasmine.createSpy('dispatchEvent');
    var wsprov = function(url, protocols) {
      ws = {
        url: url,
        protocols: protocols,
        close: jasmine.createSpy('close').and.callFake(function() {this.onClose();}),
        send: jasmine.createSpy('send'),
        on: jasmine.createSpy('on').and.callFake(function(event, callback) {
          this[event] = callback;
        })
      };
      return ws;
    };
    provider = new Provider.provider(de, wsprov);
  });
  
  afterEach(function() {
    jasmine.clock().uninstall();
  });

  function makeClientState(id, status) {
    return {
      userId: id,
      clientId: id,
      status: status,
      lastUpdated: jasmine.any(Number),
      lastSeen: jasmine.any(Number)
    };
  }
  
  it("logs in", function() {
    var d = jasmine.createSpy("login");
    provider.login({}, d);
    expect(d).not.toHaveBeenCalled();

    ws.onMessage({text: JSON.stringify({'cmd': 'state', 'id': 'yourId', 'msg':''})});
    
    expect(provider.dispatchEvent).toHaveBeenCalledWith("onClientState", makeClientState("yourId", "ONLINE"));
    expect(d).toHaveBeenCalledWith(makeClientState("yourId", "ONLINE"), undefined);
  });

  it("can getClients", function() {
    var d = jasmine.createSpy("getRoster");
    provider.login({}, function() {});
    ws.onMessage({text: JSON.stringify({'cmd': 'state', 'id': 'yourId', 'msg':['tom', 'bill']})});
    provider.getClients(d);
    expect(d.calls.count()).toEqual(1);
    expect(d.calls.mostRecent().args.length).toBeGreaterThan(0);
    expect(d.calls.mostRecent().args[0]["tom"]).toEqual(makeClientState("tom", "ONLINE"));
    expect(d.calls.mostRecent().args[0]["bill"]).toEqual(makeClientState("bill", "ONLINE"));
  });

  it("can getUsers", function() {
    var d = jasmine.createSpy("getRoster");
    provider.login({}, function() {});
    ws.onMessage({text: JSON.stringify({'cmd': 'state', 'id': 'yourId', 'msg':['tom', 'bill']})});
    provider.getUsers(d);
    expect(d.calls.count()).toEqual(1);
    expect(d.calls.mostRecent().args.length).toBeGreaterThan(0);
    expect(d.calls.mostRecent().args[0]["tom"]).toBeDefined();
    expect(d.calls.mostRecent().args[0]["bill"]).toEqual({
      userId: "bill",
      name: "bill",
      lastUpdated: jasmine.any(Number)
    });
  });


  it("logs out", function() {
    var d = jasmine.createSpy("logout");
    provider.login({}, function() {});
    provider.logout(d);
    expect(d).toHaveBeenCalled();
    expect(provider.dispatchEvent).toHaveBeenCalledWith("onClientState", jasmine.objectContaining({
      status: "OFFLINE"
    }));
    expect(ws.close).toHaveBeenCalled();
  });

  it("echos messages", function() {
    var d = jasmine.createSpy("sendMessage");
    provider.login({}, function() {});
    ws.onMessage({text: JSON.stringify({'cmd': 'state', 'id': 'yourId', 'msg':['tom', 'bill']})});
    provider.sendMessage("tom", "Hello World", d);
    expect(ws.send.calls.mostRecent().args[0])
      .toEqual({text: jasmine.any(String)});
    expect(d).toHaveBeenCalled();

    ws.onMessage({text: JSON.stringify({'cmd': 'message', 'from':'tom', 'msg':'hello'})});
    expect(provider.dispatchEvent).toHaveBeenCalledWith("onMessage", {
      from: makeClientState("tom", "ONLINE"),
      message: "hello"
    });
  });
});


