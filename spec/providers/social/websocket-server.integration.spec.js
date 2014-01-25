describe("websocket-server integration", function() {
  const TIMEOUT = 2000;
  var freedom, helper;

  beforeEach(function() {
    freedom = setupModule("relative://spec/helper/providers.json");
    helper = new ProviderHelper(freedom);
    freedom.on('return', helper.ret.bind(helper));
    helper.create("SocialA", "socialWebsockets");
    helper.create("SocialB", "socialWebsockets");
  });
  
  afterEach(function() {
    helper.removeListeners("SocialA");
    helper.removeListeners("SocialB");
    cleanupIframes();
  });

  it("sends message", function() {
    var ids = {};
    var msg = "Hello World";
    ids[0] = helper.call("SocialA", "login", [{network: "websockets",
                                             agent: "jasmine"}]);
    ids[1] = helper.call("SocialB", "login", [{network: "websockets",
                                             agent: "jasmine"}]);
    waitsFor("login", helper.hasReturned.bind(helper, ids), TIMEOUT);

    var gotMessage = false;
    runs(function() {
      var socialAStatus = helper.returns[ids[0]];
      var socialBStatus = helper.returns[ids[1]];
      helper.on("SocialB", "onMessage", function(message) {
        expect(message).not.toBe(undefined);
        expect(message).not.toBe(null);
        expect(message.fromUserId).toBe(socialAStatus.userId);
        expect(message.toUserId).toBe(socialBStatus.userId);
        expect(message.message).toEqual(msg);
        gotMessage = true;
      });
      
      ids[2] = helper.call("SocialA", "sendMessage", [socialBStatus.userId,
                                             msg]);
    });

    waitsFor("message sent from A", helper.hasReturned.bind(helper, ids),
             TIMEOUT);
    waitsFor("message received from A", function() {
      return gotMessage;
    }, TIMEOUT);

    runs(function() {
      ids[3] = helper.call("SocialA", "logout", [{}]);
      ids[4] = helper.call("SocialB", "logout", [{}]);
    });

    waitsFor("SocialA and SocialB to log out",
             helper.hasReturned.bind(helper, ids),
             TIMEOUT);

  });

  it("sends roster updates through the onChange event.", function() {
    var ids = {};
    var socialAStatus;
    function waitForIds() {
      return helper.hasReturned(ids);
    }
    ids[0] = helper.call("SocialA", "login", [{network: "websockets",
                                               agent: "jasmine"}]);

    waitsFor("SocialA to log in", helper.hasReturned.bind(helper, ids));
    
    var rosterUpdateLogin = false;
    runs(function() {
      socialAStatus = helper.returns[ids[0]];
      helper.on("SocialA", "onChange", function(info) {
        var socialBStatus = helper.returns[ids[1]];
        expect(info.userId).toEqual(socialBStatus.userId);
        expect(info.clients[info.userId].status).toEqual(2);
        rosterUpdateLogin = true;
      });
      ids[1] = helper.call("SocialB", "login", [{network: "websockets",
                                                 agent: "jasmine"}]);
    });

    waitsFor("SocialB to log in", helper.hasReturned.bind(helper, ids),
             TIMEOUT);
    waitsFor("SocialA to get roster update for SocialB login", function() {
      return rosterUpdateLogin;
    }, TIMEOUT);

    var rosterUpdateLogout = false;
    runs(function() {
      helper.removeListeners("SocialA");
      helper.on("SocialA", "onChange", function(info) {
        var socialBStatus = helper.returns[ids[1]];
        expect(info.userId).toEqual(socialBStatus.userId);
        expect(info.clients[info.userId].status).toEqual(0);
        rosterUpdateLogout = true;
      });
      ids[2] = helper.call("SocialB", "logout", [{}]);
    });

    waitsFor("SocialB to log out", helper.hasReturned.bind(helper, ids),
             TIMEOUT);
    waitsFor("SocialA to get roster update for SocialB logout", function() {
      return rosterUpdateLogout;
    }, TIMEOUT);

    runs(function() {
      ids[3] = helper.call("SocialA", "logout", [{}]);
    });
    waitsFor("SocialA to log out", helper.hasReturned.bind(helper, ids),
             TIMEOUT);
  });

  it("can return the roster", function() {
    var ids = {};
    var socialAStatus, socialBStatus;

    function checkRoster(social, returnId) {
      ids[returnId] = helper.call(social, "getRoster");
      waitsFor("gets " + social + " roster to return",
               helper.hasReturned.bind(helper, ids), TIMEOUT);
      runs(function() {
        var roster = helper.returns[ids[returnId]];
        expect(Object.keys(roster)).toContain(socialBStatus.userId);
        expect(Object.keys(roster)).toContain(socialAStatus.userId);
      });
    }

    ids[0] = helper.call("SocialA", "login", [{network: "websockets",
                                             agent: "jasmine"}]);
    ids[1] = helper.call("SocialB", "login", [{network: "websockets",
                                             agent: "jasmine"}]);
    waitsFor("login", helper.hasReturned.bind(helper, ids), TIMEOUT);

    runs(function() {
      socialAStatus = helper.returns[ids[0]];
      socialBStatus = helper.returns[ids[1]];
    });

    runs(checkRoster.bind(undefined, "SocialA", 2));
    runs(checkRoster.bind(undefined, "SocialB", 3));

    runs(function() {
      ids[4] = helper.call("SocialA", "logout", [{}]);
      ids[5] = helper.call("SocialB", "logout", [{}]);
    });

    waitsFor("SocialA and SocialB to log out",
             helper.hasReturned.bind(helper, ids),
             TIMEOUT);
  });
 
});
