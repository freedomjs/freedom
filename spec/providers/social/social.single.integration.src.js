var Promise = require("es6-promise").Promise;
module.exports = function(freedom, provider_url, freedomOpts) {
  var Social, ERRCODE;
  var client = null;

  beforeEach(function(done) {
    var complete = function() {
      client = new Social();
      ERRCODE = client.ERRCODE;
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
    Social.close(client);
    client = null;
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

  function errHandler(err) {
    console.error(err);
    expect(err).toBeUndefined();
  }

  it("logs in", function(done) {
    client.login({ agent: "jasmine" }).then(function(state) {
      expect(state).toEqual(makeClientState("ONLINE"));
      return client.logout();
    }).then(done).catch(errHandler);
  });

  it("returns clients", function(done) {
    var myClientState;
    client.login({ agent: "jasmine" }).then(function(state) {
      myClientState = state;
      return client.getClients();
    }).then(function(clientList) {
      var keys = Object.keys(clientList);
      expect(keys.length).toBeGreaterThan(0);
      expect(keys).toContain(myClientState.clientId);
      expect(clientList[myClientState.clientId]).toEqual(makeClientState("ONLINE"));
      expect(clientList[myClientState.clientId].userId).toEqual(myClientState.userId);
      expect(clientList[myClientState.clientId].clientId).toEqual(myClientState.clientId);
      return client.logout();
    }).then(done).catch(errHandler);
  });

  it("returns users", function(done) {
    var myClientState;

    client.login({ agent: "jasmine" }).then(function(state) {
      myClientState = state;
      return client.getUsers();
    }).then(function(userList) {
      var keys = Object.keys(userList);
      expect(keys.length).toBeGreaterThan(0);
      expect(keys).toContain(myClientState.userId);
      expect(userList[myClientState.userId]).toEqual(jasmine.objectContaining({
        userId: myClientState.userId,
        lastUpdated: jasmine.any(Number)
      }));
      return client.logout();
    }).then(done).catch(errHandler);
  });

  it("sends message", function(done) {
    var msg = "Hello World";
    var myClientState;
    var sendSpy = jasmine.createSpy("sendMessage");

    client.once("onMessage", function(message) {
      expect(message.from).toEqual(makeClientState("ONLINE"));
      expect(message.from.userId).toEqual(myClientState.userId);
      expect(message.from.clientId).toEqual(myClientState.clientId);
      expect(message.message).toEqual(msg);
      client.logout().then(function() {
        expect(sendSpy.calls.length || sendSpy.calls.count()).toEqual(1);
        done();
      });
    });

    client.login({ agent: "jasmine" }).then(function(state) {
      myClientState = state;
      return client.sendMessage(myClientState.clientId, msg);
    }).then(sendSpy).catch(errHandler);
  });
  
  it("ERRCODE-OFFLINE", function(done) {
    var callbackCount = 0;

    var errCounter = function(err) {
      callbackCount++;
      expect(err.errcode).toEqual("OFFLINE");
      if (callbackCount == 4) {
        done();
      }
    };

    client.getUsers().then(dead, errCounter);
    client.getClients().then(dead, errCounter);
    client.sendMessage("", "").then(dead, errCounter);
    client.logout().then(dead, errCounter);
  });

  it("ERRCODE-LOGIN_ALREADYONLINE", function(done) {
    var myClientState;

    client.login({ agent: "jasmine", interactive: false }).then(function(state) {
      myClientState = state;
      return client.login({ agent: "jasmine", interactive: false });
    }).then(dead).catch(function(err) {
      expect(err.errcode).toEqual("LOGIN_ALREADYONLINE");
      return client.logout();
    }).then(done).catch(errHandler);
  });
  
  it("ERRCODE-SEND_INVALIDDESTINATION", function(done) {
    var myClientState;

    client.login({ agent: "jasmine", interactive: false }).then(function(state) {
      myClientState = state;
      return client.sendMessage("invalid-destination", "pooballs");
    }).then(dead).catch(function(err) {
      expect(err.errcode).toEqual("SEND_INVALIDDESTINATION");
      return client.logout();
    }).then(done).catch(errHandler);
  });

};

