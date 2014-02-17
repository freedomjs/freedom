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

  xit("logs in", function(d) {
    var userId;
    var callback = function callback(status) {
      expect(status).not.toBe(undefined);
      expect(status).not.toBe(null);
      expect(status.status).toEqual(3);
      expect(status.userId).toEqual(jasmine.any(String));
      userId = status.userId;
      p.logout({userId: userId}).then(d);
    };
    p.login({ agent: "jasmine",
             interactive: false}).then(callback);
  });

  xit("logs in twice", function(d) {
    var userId;
    function loginCallback(status) {
      expect(status).not.toBe(undefined);
      expect(status).not.toBe(null);
      expect(status.status).toEqual(3);
      expect(status.userId).toEqual(jasmine.any(String));
      userId = status.userId;
      p.login({agent: "jasmine",
               interactive: false}).then(secondLoginCallback);
    }
    function secondLoginCallback(status) {
      expect(status).not.toBe(undefined);
      expect(status).not.toBe(null);
      expect(status.status).toEqual(3);
      expect(status.userId).toEqual(userId);
      p.logout().then(d);
    }
    p.login({agent: "jasmine",
             interactive: false}).then(loginCallback);
  });

  xit("logs out when already logged out", function(done) {
    var logoutCallback = false;
    p.logout().then(function(status) {
      expect(status).not.toBe(undefined);
      expect(status).not.toBe(null);
      expect(status.status).toEqual(0);
      done();
    });
  });

  xit("returns roster", function(done) {
    var userId;

    var loginCallback = function callback(status) {
      userId = status.userId;
      p.getRoster().then(function getRosterCallback(result) {
        var ids = Object.keys(result);
        expect(ids.length).toBeGreaterThan(0);
        expect(ids).toContain(userId);
        p.logout({userId: userId}).then(done);
      });
    };

    p.login({agent: "jasmine",
             interactive: false}).then(loginCallback);
  });

  xit("sends message", function(d){
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
        p.logout({userId: userId}).then(d);
      };
    });

    p.login({agent: "jasmine",
             interactive: false}).then(loginCallback);
  });
};

describe("unit: social.ws.json", SOCIAL_UNIT_SPEC.bind(this, "providers/social/websocket-server/social.ws.json"));
describe("unit: social.loopback.json", SOCIAL_UNIT_SPEC.bind(this, "providers/social/loopback/social.loopback.json"));

