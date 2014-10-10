var testUtil = require('../../util');

module.exports = function(provider_url, setup) {
  var helper;
  var ERRCODE = testUtil.getApis().get("social").definition.ERRCODE.value;

  beforeEach(function(done) {
    setup();
    testUtil.providerFor(provider_url, 'social').then(function(h) {
      helper = h;
      helper.create("s");
      done();
    });
  });
  
  afterEach(function(done) {
    helper.removeListeners("s");
    testUtil.cleanupIframes();
    done();
  });

  function makeClientState(status) {
    return {
      userId: jasmine.any(String),
      clientId: jasmine.any(String),
      status: status,
      lastUpdated: jasmine.any(Number),
      lastSeen: jasmine.any(Number)
    };
  }

  function dead() {
    console.error("This should never be called");
  };
  
  it("logs in", function(done) {
    var ids = {};
    var callbackOne = function(ret) {
      expect(ret).toEqual(makeClientState("ONLINE"));
      ids[1] = helper.call("s", "logout", [], function(ret) {
        done();
      });
    };
    
    ids[0] = helper.call("s", "login", [{agent: "jasmine", interactive: false}], callbackOne);
  });

  it("returns clients", function(done) {
    var ids = {};
    var myClientState;
    var callbackOne = function(ret) {
      myClientState = ret;
      ids[1] = helper.call("s", "getClients", [], callbackTwo);
    };
    var callbackTwo = function(ret) {
      var keys = Object.keys(ret);
      expect(keys.length).toBeGreaterThan(0);
      expect(keys).toContain(myClientState.clientId);
      expect(ret[myClientState.clientId]).toEqual(makeClientState("ONLINE"));
      expect(ret[myClientState.clientId].userId).toEqual(myClientState.userId);
      expect(ret[myClientState.clientId].clientId).toEqual(myClientState.clientId);
      ids[2] = helper.call("s", "logout", [], function(ret) {
        done();
      });
    };
    
    ids[0] = helper.call("s", "login", [{agent: "jasmine", interactive: false}], callbackOne);
  });


  it("returns users", function(done) {
    var ids = {};
    var myClientState;
    var callbackOne = function(ret) {
      myClientState = ret;
      ids[1] = helper.call("s", "getUsers", [], callbackTwo);
    };
    var callbackTwo = function(ret) {
      var keys = Object.keys(ret);
      expect(keys.length).toBeGreaterThan(0);
      expect(keys).toContain(myClientState.userId);
      expect(ret[myClientState.userId]).toEqual(jasmine.objectContaining({
        userId: myClientState.userId,
        lastUpdated: jasmine.any(Number)
      }));
      ids[2] = helper.call("s", "logout", [], function(ret) {
        done();
      });
    };
    
    ids[0] = helper.call("s", "login", [{agent: "jasmine", interactive: false}], callbackOne);
  });

  it("sends message", function(done) {
    var ids = {};
    var msg = "Hello World";
    var myClientState;
    var sendSpy = jasmine.createSpy("sendMessage");

    helper.on("s", "onMessage", function(message) {
      expect(message.from).toEqual(makeClientState("ONLINE"));
      expect(message.from.userId).toEqual(myClientState.userId);
      expect(message.from.clientId).toEqual(myClientState.clientId);
      expect(message.message).toEqual(msg);
      ids[2] = helper.call("s", "logout", [], function(ret) {
        expect(sendSpy.calls.length || sendSpy.calls.count()).toEqual(1);
        done();
      });
    });
    var callbackOne = function(ret) {
      myClientState = ret;
      ids[1] = helper.call("s", "sendMessage", [myClientState.clientId, msg], sendSpy);
    };
        
    ids[0] = helper.call("s", "login", [{agent: "jasmine", interactive: false}], callbackOne);
  });
  
  it("ERRCODE-OFFLINE", function(done) {
    var ids = {};
    var callbackCount = 0;

    var checkDone = function() {
      var keys = Object.keys(ids);
      if (callbackCount >= keys.length) {
        done();
      }
    };
    var errHandler = function(err) {
      callbackCount++;
      expect(err.errcode).toEqual("OFFLINE");
      checkDone();
    };

    ids[0] = helper.call("s", "getUsers", [], dead, errHandler);
    ids[1] = helper.call("s", "getClients", [], dead, errHandler);
    ids[2] = helper.call("s", "sendMessage", ["",""], dead, errHandler);
    ids[3] = helper.call("s", "logout", [], dead, errHandler);
  
  });

  it("ERRCODE-LOGIN_ALREADYONLINE", function(done) {
    var ids = {};
    var myClientState;
    var callbackOne = function(ret) {
      myClientState = ret;
      ids[1] = helper.call("s", "login", [{agent: "jasmine", interactive: false}], dead, errHandler);
    };
    var errHandler = function(err) {
      expect(err.errcode).toEqual("LOGIN_ALREADYONLINE");
      ids[2] = helper.call("s", "logout", [], done);
    }
        
    ids[0] = helper.call("s", "login", [{agent: "jasmine", interactive: false}], callbackOne);
  });
  
  it("ERRCODE-SEND_INVALIDDESTINATION", function(done) {
    var ids = {};
    var myClientState;
    var callbackOne = function(ret) {
      myClientState = ret;
      ids[1] = helper.call("s", "sendMessage", ["invalid-destination", "pooballs"], dead, errHandler);
    };
    var errHandler = function(err) {
      expect(err.errcode).toEqual("SEND_INVALIDDESTINATION");
      ids[2] = helper.call("s", "logout", [], done);
    }
        
    ids[0] = helper.call("s", "login", [{agent: "jasmine", interactive: false}], callbackOne);
  });

 
};

