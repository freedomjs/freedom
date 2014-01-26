var SOCIAL_SPEC = function(manifest_url) {
  const TIMEOUT = 2000;
  var proxy, p;

  beforeEach(function() {
    var firstStatus;
    proxy = createProxyFor(manifest_url, "social");
    runs(function() {
      p = proxy();
      p.on("onStatus", function(status) {
        firstStatus = true;
      });
    });

    waitsFor(function() {
      return firstStatus;
    }, 500);
  });

  it("logs in", function() {
    var loginCallback = false;
    var userId;
    var callback = function callback(status) {
      loginCallback = true;
      expect(status).not.toBe(undefined);
      expect(status).not.toBe(null);
      expect(status.status).toEqual(3);
      expect(status.userId).toEqual(jasmine.any(String));
      userId = status.userId;
    };
    p.login({ agent: "jasmine",
             interactive: false}).done(callback);

    waitsFor(function() {
      return loginCallback;
    }, TIMEOUT);

    runs(function logout() {
      p.logout({userId: userId});
    });
  });

  it("logs in, then out (x5)", function() {
    var logins = 0;
    function logoutCallback(status) {
      expect(status).not.toBe(undefined);
      expect(status).not.toBe(null);
      expect(status.status).toEqual(0);
      if (logins < 5) {
        p.login({agent: "jasmine",
                 interactive: false}).done(loginCallback);
      }
    }
    function loginCallback(status) {
      expect(status).not.toBe(undefined);
      expect(status).not.toBe(null);
      expect(status.status).toEqual(3);
      expect(status.userId).toEqual(jasmine.any(String));
      userId = status.userId;
      logins += 1;
      p.logout().done(logoutCallback);
    }
    p.login({agent: "jasmine",
             interactive: false}).done(loginCallback);
    waitsFor(function() {
      return logins === 5;
    }, TIMEOUT);
  });

  it("logs in twice", function() {
    var userId;
    var loggedOut = false;
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
      p.logout().done(function() {
        loggedOut = true;
      });
    }
    p.login({agent: "jasmine",
             interactive: false}).done(loginCallback);
    waitsFor(function() {
      return loggedOut;
    }, TIMEOUT);
  });

  it("logs out when already logged out", function() {
    var logoutCallback = false;
    p.logout().done(function(status) {
      expect(status).not.toBe(undefined);
      expect(status).not.toBe(null);
      expect(status.status).toEqual(0);
      logoutCallback = true;
    });
    waitsFor(function() {
      return logoutCallback;
    }, TIMEOUT);
  });

  it("returns roster", function() {
    var rosterReturns = false;
    var userId;

    var loginCallback = function callback(status) {
      userId = status.userId;
      p.getRoster().done(function getRosterCallback(result) {
        var ids = Object.keys(result);
        expect(ids.length).toBeGreaterThan(0);
        expect(ids).toContain(userId);
        rosterReturns = true;
      });
    };

    p.login({agent: "jasmine",
             interactive: false}).done(loginCallback);

    waitsFor(function() {
      return rosterReturns;
    }, TIMEOUT);

    runs(function logout() {
      p.logout({userId: userId});
    });
  });

  it("sends message", function(){
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
        messageReceived = true;
      };
    });

    p.login({agent: "jasmine",
             interactive: false}).done(loginCallback);

    waitsFor(function() {
      return messageReceived;
    }, TIMEOUT);

    runs(function logout() {
      p.logout({userId: userId});
    });
  });

};

describe("social.ws.json", SOCIAL_SPEC.bind(this, "providers/social/websocket-server/social.ws.json"));
describe("social.loopback.json", SOCIAL_SPEC.bind(this, "providers/social/loopback/social.loopback.json"));

