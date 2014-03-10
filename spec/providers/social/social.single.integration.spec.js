var SOCIAL_SINGLE_INTEGRATION_SPEC = function(provider_name) {
  var freedom, helper;
  var ERRCODE = fdom.apis.get("social").definition.ERRCODE.value;

  beforeEach(function(done) {
    freedom = setupModule("relative://spec/helper/providers.json");
    helper = new ProviderHelper(freedom);
    helper.create("s", provider_name);
    done();
  });
  
  afterEach(function(done) {
    helper.removeListeners("s");
    cleanupIframes();
    done();
  });

  function makeClientState(status) {
    return {
      userId: jasmine.any(String),
      clientId: jasmine.any(String),
      status: status,
      timestamp: jasmine.any(Number)
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
        timestamp: jasmine.any(Number)
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
      expect(message.to).toEqual(makeClientState("ONLINE"));
      expect(message.from).toEqual(makeClientState("ONLINE"));
      expect(message.to.userId).toEqual(myClientState.userId);
      expect(message.to.clientId).toEqual(myClientState.clientId);
      expect(message.from.userId).toEqual(myClientState.userId);
      expect(message.from.clientId).toEqual(myClientState.clientId);
      expect(message.message).toEqual(msg);
      ids[2] = helper.call("s", "logout", [], function(ret) {
        expect(sendSpy.calls.count()).toEqual(1);
        done();
      });
    });
    var callbackOne = function(ret) {
      myClientState = ret;
      ids[1] = helper.call("s", "sendMessage", [myClientState.clientId, msg], sendSpy);
    };
        
    ids[0] = helper.call("s", "login", [{agent: "jasmine", interactive: false}], callbackOne);
  });
  
  xit("ERRCODE-OFFLINE", function(done) {
    var ids = {};
    var myClientState;
  
  });

  xit("ERRCODE-LOGIN_ALREADYONLINE", function(done) {
    var ids = {};
    var myClientState;
    
  
  });
  
  it("ERRCODE-SEND_INVALIDDESTINATION", function(done) {
    var ids = {};
    var myClientState;
    var callbackOne = function(ret) {
      myClientState = ret;
      ids[1] = helper.call("s", "sendMessage", ["invalid-destination", "pooballs"], dead, errHandler);
    };
    var errHandler = function(err) {
      //expect(err).toEqual(ERRCODE["SEND_INVALIDDESTINATION"]);
      ids[2] = helper.call("s", "logout", [], done);
    }
        
    ids[0] = helper.call("s", "login", [{agent: "jasmine", interactive: false}], callbackOne);
  });

 
};

describe("integration-single: social.loopback.json", SOCIAL_SINGLE_INTEGRATION_SPEC.bind(this, "social.loopback"));
describe("integration-single: social.ws.json", SOCIAL_SINGLE_INTEGRATION_SPEC.bind(this, "social.ws"));
