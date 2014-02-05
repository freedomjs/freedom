var SOCIAL_INTEGRATION_SPEC = function(provider_name, network_id) {
  const TIMEOUT = 2000;
  var freedom, helper;

  beforeEach(function() {
    freedom = setupModule("relative://spec/helper/providers.json");
    helper = new ProviderHelper(freedom);
    freedom.on('return', helper.ret.bind(helper));
    helper.create("SocialA", provider_name);
    helper.create("SocialB", provider_name);
  });
  
  afterEach(function() {
    helper.removeListeners("SocialA");
    helper.removeListeners("SocialB");
    cleanupIframes();
  });

  function makeOnStatus(status) {
    return {
      network: network_id,
      userId: jasmine.any(String),
      clientId: jasmine.any(String),
      status: fdom.apis.get("social").definition.STATUS_NETWORK.value[status],
      message: jasmine.any(String)
    };
  }
  
  it("logs in", function() {
    var ids = {};
    
    runs(function() {
      ids[0] = helper.call("SocialA", "login", [{network: network_id, agent: "jasmine", interactive: false}]);
    });
    waitsFor("logs in", helper.hasReturned.bind(helper, ids), TIMEOUT);

    runs(function() {
      expect(helper.returns[ids[0]]).toBeDefined();
      expect(helper.returns[ids[0]]).toEqual(makeOnStatus("ONLINE"));
      ids[1] = helper.call("SocialA", "logout", [{}]);
    });
  
  });

  it("A-B: sends message between A->B", function() {
    var ids = {};
    var msg = "Hello World";
    ids[0] = helper.call("SocialA", "login", [{network: network_id,
                                             agent: "jasmine"}]);
    ids[1] = helper.call("SocialB", "login", [{network: network_id,
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

  it("A-B: sends roster updates through the onChange event.", function() {
    var ids = {};
    var socialAStatus;
    function waitForIds() {
      return helper.hasReturned(ids);
    }
    ids[0] = helper.call("SocialA", "login", [{network: network_id,
                                               agent: "jasmine"}]);

    waitsFor("SocialA to log in", helper.hasReturned.bind(helper, ids));
    
    var rosterUpdateLogin = false;
    runs(function() {
      socialAStatus = helper.returns[ids[0]];
      helper.on("SocialA", "onChange", function(info) {        
        waitsFor("SocialB to log in", helper.hasReturned.bind(helper, ids),
                 TIMEOUT);
        runs(function() {
          var socialBStatus = helper.returns[ids[1]];
          if (info.userId === socialBStatus.userId) {
            expect(info.clients[info.userId].status).toEqual(2);
            rosterUpdateLogin = true;
          }
        });
      });
      ids[1] = helper.call("SocialB", "login", [{network: network_id,
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

  it("A-B: can return the roster", function() {
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

    ids[0] = helper.call("SocialA", "login", [{network: network_id,
                                             agent: "jasmine"}]);

    waitsFor("SocialA login", helper.hasReturned.bind(helper, ids), TIMEOUT);

    runs(function() {
      ids[1] = helper.call("SocialB", "login", [{network: network_id,
                                                 agent: "jasmine"}]);
    });

    waitsFor("SocialB login", helper.hasReturned.bind(helper, ids), TIMEOUT);

    runs(function() {
      socialAStatus = helper.returns[ids[0]];
      socialBStatus = helper.returns[ids[1]];
    });

    runs(checkRoster.bind(undefined, "SocialB", 2));
    runs(checkRoster.bind(undefined, "SocialA", 3));
    
    runs(function() {
      ids[4] = helper.call("SocialA", "logout", [{}]);
      ids[5] = helper.call("SocialB", "logout", [{}]);
    });

    waitsFor("SocialA and SocialB to log out",
             helper.hasReturned.bind(helper, ids),
             TIMEOUT);
  });
 
};

describe("integration: social.ws.json",
         SOCIAL_INTEGRATION_SPEC.bind(this, "social.ws", "websockets"));
