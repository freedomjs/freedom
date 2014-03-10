var SOCIAL_DOUBLE_INTEGRATION_SPEC = function(provider_name) {
  var freedom, helper;

  beforeEach(function(done) {
    freedom = setupModule("relative://spec/helper/providers.json");
    helper = new ProviderHelper(freedom);
    helper.create("SocialA", provider_name);
    helper.create("SocialB", provider_name);
    done();
  });
  
  afterEach(function(done) {
    helper.removeListeners("SocialA");
    helper.removeListeners("SocialB");
    cleanupIframes();
    done();
  });

  function makeClientState(userId, clientId, status) {
    return {
      userId: userId,
      clientId: clientId,
      status: fdom.apis.get("social").definition.STATUS.value[status],
      timestamp: jasmine.any(Number)
    };
  }

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
      ids[2] = helper.call("SocialA", "sendMessage", [clientStateB.userId, msg]);
    };

    ids[0] = helper.call("SocialA", "login", [{agent: "jasmine"}], callbackOne);
  });

  it("A-B: sends roster updates through the onChange event.", function(done) {
    var ids = {};
    var clientStateA, clientStateB = null;
    var receivedClientState = [];
    var receivedUserProfiles = [];
    var ranExpectations = false;
  
    helper.on("SocialA", "onUserProfile", function(info) {
      receivedUserProfiles.push(info);
    });

    helper.on("SocialA", "onClientState", function(info) {
      receivedClientState.push(info);
      if (receivedClientState.length >= 2 && clientStateB !== null && !ranExpectations) {
        ranExpectations = true;
        expect(receivedUserProfiles).toContain(jasmine.objectContaining({
          userId: clientStateB.userId,
          timestamp: jasmine.any(Number)
        }));
        expect(receivedClientState).toContain(makeClientState(clientStateB.userId, clientStateB.clientId, "ONLINE"));
        expect(receivedClientState).toContain(makeClientState(clientStateB.userId, clientStateB.clientId, "OFFLINE"));
        ids[3] = helper.call("SocialA", "logout", [], done);
      }
    });

    var callbackOne = function(ret) {
      clientStateA = ret;
      ids[1] = helper.call("SocialB", "login", [{agent: "jasmine"}], callbackTwo);
    }
    var callbackTwo = function(ret) {
      clientStateB = ret;
      ids[2] = helper.call("SocialB", "logout", []);
    };

    ids[0] = helper.call("SocialA", "login", [{agent: "jasmine"}], callbackOne);
  });

  xit("A-B: can return the roster", function(done) {
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
