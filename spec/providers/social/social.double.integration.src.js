var Promise = require("es6-promise").Promise;
module.exports = function(freedom, provider_url, freedomOpts) {
  var Social, ERRCODE;
  var c1 = null;
  var c2 = null;

  var Helper = {
    makeClientState: function(userId, clientId, status) {
      return {
        userId: userId,
        clientId: clientId,
        status: status,
        lastUpdated: jasmine.any(Number),
        lastSeen: jasmine.any(Number)
      };
    },
    makeUserProfile: function(userId) {
      return jasmine.objectContaining({
        userId: userId,
        lastUpdated: jasmine.any(Number)
      });
    },
    errHandler: function(err) {
      console.error(err);
      expect(err).toBeUndefined();
    }
  };

  beforeEach(function(done) {
    var complete = function() {
      c1 = new Social();
      c2 = new Social();
      ERRCODE = c1.ERRCODE;
      done();
    };
    // Only create a freedom module the first time
    // Fails on Firefox otherwise
    if (typeof Social === "undefined") {
      freedom(provider_url, freedomOpts).then(function(constructor) {
        Social = constructor;
        complete();
      });
    } else {
      complete();
    }
  });

  afterEach(function(done) {
    Social.close(c1);
    Social.close(c2);
    c1 = null;
    c2 = null;
    done();
  });

  it("A-B: sends roster updates through the onChange event.", function(done) {
    var c1State, c2State = null;
    var c1StateEvts = [];
    var c1ProfileEvts = [];
    var ranExpectations = false;
  
    c1.on("onUserProfile", function(info) {
      c1ProfileEvts.push(info);
    });

    c1.on("onClientState", function(info) {
      c1StateEvts.push(info);
      if (c2State !== null) {
        // Only wanna see statuses from clientB
        c1StateEvts = c1StateEvts.filter(function(elt) {
          return elt.clientId == c2State.clientId;
        });
        //Expect to see ONLINE then OFFLINE from clientB
        if (!ranExpectations && c1StateEvts.length >= 2 ) {
          ranExpectations = true;
          expect(c1ProfileEvts).toContain(Helper.makeUserProfile(c2State.userId));
          expect(c1StateEvts).toContain(Helper.makeClientState(c2State.userId, c2State.clientId, "ONLINE"));
          expect(c1StateEvts).toContain(Helper.makeClientState(c2State.userId, c2State.clientId, "OFFLINE"));
          c1.logout().then(done).catch(Helper.errHandler);
        }
      }
    });
    
    Promise.all([ c1.login({ agent: "jasmine" }), c2.login({ agent: "jasmine" }) ]).then(function (ret) {
      c1State = ret[0];
      c2State = ret[1];
      return c2.logout();
    }).catch(Helper.errHandler);
  });

  it("A-B: sends message between A->B", function(done) {
    var c1State, c2State;
    var c1StateEvts = [];
    var sent = false;
    var msg = "Hello World-" + Math.random();

    var c2Online = function() {
      for(var i = 0; i < c1StateEvts.length; i++) {
        if (typeof c2State !== "undefined" &&
            c1StateEvts[i].clientId == c2State.clientId &&
            c1StateEvts[i].status == "ONLINE") {
          return true;
        }
      }
      return false;
    };

    var trySend = function() {
      if (!sent && c2Online()) {
        sent = true;
        c1.sendMessage(c2State.clientId, msg).then(function(ret) {
          // Message sent
        }).catch(Helper.errHandler);
      }
    };
    
    c1.on("onClientState", function(info) {
      c1StateEvts.push(info);
      trySend();
    });

    c2.once("onMessage", function(message) {
      expect(message.from).toEqual(Helper.makeClientState(c1State.userId, c1State.clientId, "ONLINE"));
      expect(message.message).toEqual(msg);
      Promise.all([ c1.logout(), c2.logout() ]).then(done).catch(Helper.errHandler);
    });

    Promise.all([ c1.login({ agent: "jasmine" }), c2.login({ agent: "jasmine" }) ]).then(function (ret) {
      c1State = ret[0];
      c2State = ret[1];
      trySend();
    }).catch(Helper.errHandler);
  });
  
  it("A-B: can return the roster", function(done) {
    var c1State, c2State;
    var triggered = false;
    var c1ProfileEvts = [];
    var c2ProfileEvts = [];
    var c1StateEvts = [];
    var c2StateEvts = [];

    // Checks if we see both users for a set of events
    var seeBoth = function(evts, key) {
      var saw1 = false, saw2 = false;
      for (var i = 0; i < evts.length; i++) {
        if (typeof c1State !== "undefined" && evts[i][key] == c1State[key]) {
          saw1 = true;
        }
        if (typeof c2State !== "undefined" && evts[i][key] == c2State[key]) {
          saw2 = true;
        }
      }
      return saw1 && saw2;
    };
    
    // Triggered on every event, waiting until all necessary events are collected
    var tryGetRoster = function(arr, info) {
      if (typeof arr !== "undefined") {
        arr.push(info);
      }
      if (!triggered &&
          seeBoth(c1ProfileEvts, "userId") && seeBoth(c2ProfileEvts, "userId") &&
          seeBoth(c1StateEvts, "clientId") && seeBoth(c2StateEvts, "clientId")) {
        triggered = true;
        Promise.all([ c1.getUsers(), c2.getUsers(), c1.getClients(), c2.getClients() ]).then(function(ret) {
          expect(ret[0][c1State.userId]).toEqual(Helper.makeUserProfile(c1State.userId));
          expect(ret[0][c2State.userId]).toEqual(Helper.makeUserProfile(c2State.userId));
          expect(ret[1][c1State.userId]).toEqual(Helper.makeUserProfile(c1State.userId));
          expect(ret[1][c2State.userId]).toEqual(Helper.makeUserProfile(c2State.userId));
          expect(ret[2][c1State.clientId]).toEqual(Helper.makeClientState(c1State.userId, c1State.clientId, "ONLINE"));
          expect(ret[2][c2State.clientId]).toEqual(Helper.makeClientState(c2State.userId, c2State.clientId, "ONLINE"));
          expect(ret[3][c1State.clientId]).toEqual(Helper.makeClientState(c1State.userId, c1State.clientId, "ONLINE"));
          expect(ret[3][c2State.clientId]).toEqual(Helper.makeClientState(c2State.userId, c2State.clientId, "ONLINE"));
          return Promise.all([ c1.logout(), c2.logout() ]);
        }).then(done).catch(Helper.errHandler);
      }
    };

    c1.on("onUserProfile", tryGetRoster.bind({}, c1ProfileEvts));
    c2.on("onUserProfile", tryGetRoster.bind({}, c2ProfileEvts));
    c1.on("onClientState", tryGetRoster.bind({}, c1StateEvts));
    c2.on("onClientState", tryGetRoster.bind({}, c2StateEvts));

    Promise.all([ c1.login({ agent: "jasmine" }),  c2.login({ agent: "jasmine" }) ]).then(function(ret) {
      c1State = ret[0];
      c2State = ret[1];
      tryGetRoster();
    }).catch(Helper.errHandler);
  });

};

