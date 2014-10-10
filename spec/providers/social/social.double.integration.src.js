var testUtil = require('../../util');

module.exports = function(provider_url, setup) {
  var helper;

  beforeEach(function(done) {
    setup();
    testUtil.providerFor(provider_url, 'social').then(function(h) {
      helper = h;
      helper.create("SocialA");
      helper.create("SocialB");
      done();
    });
  });
  
  afterEach(function(done) {
    helper.removeListeners("SocialA");
    helper.removeListeners("SocialB");
    testUtil.cleanupIframes();
    done();
  });

  function makeClientState(userId, clientId, status) {
    return {
      userId: userId,
      clientId: clientId,
      status: status,
      lastUpdated: jasmine.any(Number),
      lastSeen: jasmine.any(Number)
    };
  }

  function makeUserProfile(userId) {
    return jasmine.objectContaining({
      userId: userId,
      lastUpdated: jasmine.any(Number)
    });
  }

  it("A-B: sends message between A->B", function(done) {
    var ids = {};
    var msg = "Hello World";
    var clientStateA, clientStateB;

    helper.on("SocialB", "onMessage", function(message) {
      expect(message.from).toEqual(makeClientState(clientStateA.userId, clientStateA.clientId, "ONLINE"));
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

      if (clientStateB !== null) {
        // Only wanna see statuses from clientB
        receivedClientState = receivedClientState.filter(function(elt) {
          return elt.clientId == clientStateB.clientId;
        });
        //Expect to see ONLINE then OFFLINE from clientB
        if (!ranExpectations &&
            receivedClientState.length >= 2 ) {
          ranExpectations = true;
          expect(receivedUserProfiles).toContain(makeUserProfile(clientStateB.userId));
          expect(receivedClientState).toContain(makeClientState(clientStateB.userId, clientStateB.clientId, "ONLINE"));
          expect(receivedClientState).toContain(makeClientState(clientStateB.userId, clientStateB.clientId, "OFFLINE"));
          ids[3] = helper.call("SocialA", "logout", [], done);
        }
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

  it("A-B: can return the roster", function(done) {
    var ids = {};
    var clientStateA, clientStateB = null;
    var callbackCount = 0;
    var loggingOut = false;

    var callbackOne = function(ret) {
      clientStateA = ret;
      ids[1] = helper.call("SocialB", "login", [{agent: "jasmine"}], callbackTwo);
    };
    var callbackTwo = function(ret) {
      clientStateB = ret;
      ids[2] = helper.call("SocialA", "getUsers", [], callbackGetUsers);
      ids[3] = helper.call("SocialB", "getUsers", [], callbackGetUsers);
      ids[4] = helper.call("SocialA", "getClients", [], callbackGetClients);
      ids[5] = helper.call("SocialB", "getClients", [], callbackGetClients);
    };
    var callbackGetUsers = function(ret) {
      callbackCount++;
      expect(ret[clientStateA.userId]).toEqual(makeUserProfile(clientStateA.userId));
      expect(ret[clientStateB.userId]).toEqual(makeUserProfile(clientStateB.userId));
      checkDone();
    };
    var callbackGetClients = function(ret) {
      callbackCount++;
      expect(ret[clientStateA.clientId]).toEqual(makeClientState(clientStateA.userId, clientStateA.clientId, "ONLINE"));
      expect(ret[clientStateB.clientId]).toEqual(makeClientState(clientStateB.userId, clientStateB.clientId, "ONLINE"));
      checkDone();
    };
    var checkDone = function() {
      if (callbackCount >= 4 && !loggingOut) {
        loggingOut = true;
        ids[6] = helper.call("SocialA", "logout", [], function(ret) {
          ids[7] = helper.call("SocialB", "logout", [], done);
        });
      }
    };
    
    ids[0] = helper.call("SocialA", "login", [{agent: "jasmine"}], callbackOne);
  });
 
};

