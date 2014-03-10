var SOCIAL_DOUBLE_INTEGRATION_SPEC = function(provider_name) {
  var freedom, helper;

  beforeEach(function(done) {
    freedom = setupModule("relative://spec/helper/providers.json");
    helper = new ProviderHelper(freedom);
    helper.create("SocialA", provider_name);
    helper.create("SocialB", provider_name);
    done();
  });
  
  afterEach(function() {
    helper.removeListeners("SocialA");
    helper.removeListeners("SocialB");
    cleanupIframes();
  });

  it("A-B: sends message between A->B", function(done) {
    var ids = {};
    var msg = "Hello World";
    var clientStateA, clientStateB;

    helper.on("SocialB", "onMessage", function(message) {
      expect(message.from).toEqual(jasmine.objectContaining({
        userId: clientStateA.userId,
        clientId: clientStateA.clientId,
        status: fdom.apis.get("social").definition.STATUS.value["ONLINE"]
      }));
      expect(message.to).toEqual(jasmine.objectContaining({
        userId: clientStateB.userId,
        clientId: clientStateB.clientId,
        status: fdom.apis.get("social").definition.STATUS.value["ONLINE"]
      }));
      expect(message.message).toEqual(msg);
      // Cleanup and finish
      ids[3] = helper.call("SocialA", "logout", [], function(ret) {
        ids[4] = helper.call("SocialB", "logout", [], function(ret) {
          done();
        });
      });
    });
    
    var callbackOne = function(ret) {
      clientStateA = ret;
      ids[1] = helper.call("SocialB", "login", [{agent: "jasmine"}], callbackTwo);
    };
    var callbackTwo = function(ret) {
      clientStateB = ret;
      ids[2] = helper.call("SocialA", "sendMessage", [socialBStatus.userId, msg]);
    };

    ids[0] = helper.call("SocialA", "login", [{agent: "jasmine"}], callbackOne);
  });

  xit("A-B: sends roster updates through the onChange event.", function() {
    var ids = {};
    var socialAStatus;
    function waitForIds() {
      return helper.hasReturned(ids);
    }
    ids[0] = helper.call("SocialA", "login", [{agent: "jasmine"}]);

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
      ids[1] = helper.call("SocialB", "login", [{agent: "jasmine"}]);
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

  xit("A-B: can return the roster", function() {
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

    ids[0] = helper.call("SocialA", "login", [{agent: "jasmine"}]);

    waitsFor("SocialA login", helper.hasReturned.bind(helper, ids), TIMEOUT);

    runs(function() {
      ids[1] = helper.call("SocialB", "login", [{agent: "jasmine"}]);
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

describe("integration-double: social.ws.json", SOCIAL_DOUBLE_INTEGRATION_SPEC.bind(this, "social.ws"));
