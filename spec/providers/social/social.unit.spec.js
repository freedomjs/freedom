var SOCIAL_UNIT_SPEC = function(manifest_url) {
  const TIMEOUT = 2000;
  var proxy, p;
  beforeEach(function(done) {
    proxy = createProxyFor(manifest_url, "social");
    p = proxy();
    p.once("onStatus", function(status) {
      done();
    });
  });

  it("logs in", function(d) {
    var userId;
    var callback = function callback(status) {
      expect(status).not.toBe(undefined);
      expect(status).not.toBe(null);
      expect(status.status).toEqual(3);
      expect(status.userId).toEqual(jasmine.any(String));
      userId = status.userId;
      p.logout({userId: userId}).done(d);
    };
    p.login({ agent: "jasmine",
             interactive: false}).done(callback);
  });

  it("logs in twice", function(d) {
    var userId;
    function loginCallback(status) {
      expect(status).not.toBe(undefined);
      expect(status).not.toBe(null);
      expect(status.status).toEqual(3);
      expect(status.userId).toEqual(jasmine.any(String));
      userId = status.userId;
      p.login({agent: "jasmine",
               interactive: false}).done(secondLoginCallback);
    }
    function secondLoginCallback(status) {
      expect(status).not.toBe(undefined);
      expect(status).not.toBe(null);
      expect(status.status).toEqual(3);
      expect(status.userId).toEqual(userId);
      p.logout().done(d);
    }
    p.login({agent: "jasmine",
             interactive: false}).done(loginCallback);
  });

  it("logs out when already logged out", function(done) {
    var logoutCallback = false;
    p.logout().done(function(status) {
      expect(status).not.toBe(undefined);
      expect(status).not.toBe(null);
      expect(status.status).toEqual(0);
      done();
    });
  });

  it("returns roster", function(done) {
    var userId;

    var loginCallback = function callback(status) {
      userId = status.userId;
      p.getRoster().done(function getRosterCallback(result) {
        var ids = Object.keys(result);
        expect(ids.length).toBeGreaterThan(0);
        expect(ids).toContain(userId);
        p.logout({userId: userId}).done(done);
      });
    };

    p.login({agent: "jasmine",
             interactive: false}).done(loginCallback);
  });

  it("sends message", function(d){
    var rosterReturns = false;
    var messageReceived = false;
    var userId, clientId;

    var loginCallback = function callback(status) {
      userId = status.userId;
      clientId = status.clientId;
      p.sendMessage(userId, "Hello World");
    };

    p.on("onMessage", function onMessage(message) {
      expect(message).not.toBe(undefined);
      expect(message).not.toBe(null);
      if (message.toClientId === clientId &&
         message.message === "Hello World") {
        p.logout({userId: userId}).done(d);
      };
    });

    p.login({agent: "jasmine",
             interactive: false}).done(loginCallback);
  });
};

describe("unit: social.ws.json", SOCIAL_UNIT_SPEC.bind(this, "providers/social/websocket-server/social.ws.json"));
describe("unit: social.loopback.json", SOCIAL_UNIT_SPEC.bind(this, "providers/social/loopback/social.loopback.json"));

