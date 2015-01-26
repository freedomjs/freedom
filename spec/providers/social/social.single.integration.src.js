
module.exports = function(freedom, provider_url, freedomOpts) {
  var Social, client, ERRCODE;

  beforeEach(function(done) {
    freedom(provider_url, freedomOpts).then(function(constructor) {
      Social = constructor;
      client = new Social();
      ERRCODE = client.ERRCODE;
      done();
    });
  });
  
  afterEach(function(done) {
    Social.close(client);
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
    client.login({ agent: "jasmine" }).then(function(state) {
      expect(state).toEqual(makeClientState("ONLINE"));
      client.logout().then(done);
    });
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
    }).then(done);
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
    }).then(done);
  });

  it("sends message", function(done) {
    var msg = "Hello World";
    var myClientState;
    var sendSpy = jasmine.createSpy("sendMessage");

    client.on("onMessage", function(message) {
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
    }).then(sendSpy);
  });
  
  it("ERRCODE-OFFLINE", function(done) {
    var callbackCount = 0;

    var errHandler = function(err) {
      callbackCount++;
      expect(err.errcode).toEqual("OFFLINE");
      if (callbackCount >= 4) {
        done();
      }
    };

    client.getUsers().then(dead, errHandler);
    client.getClients().then(dead, errHandler);
    client.sendMessage("", "").then(dead, errHandler);
    client.logout().then(dead, errHandler);
  });

  it("ERRCODE-LOGIN_ALREADYONLINE", function(done) {
    var myClientState;

    client.login({ agent: "jasmine", interactive: false }).then(function(state) {
      myClientState = state;
      return client.login({ agent: "jasmine", interactive: false });
    }).then(dead).catch(function(err) {
      expect(err.errcode).toEqual("LOGIN_ALREADYONLINE");
      return client.logout();
    }).then(done);
  });
  
  it("ERRCODE-SEND_INVALIDDESTINATION", function(done) {
    var myClientState;

    client.login({ agent: "jasmine", interactive: false }).then(function(state) {
      myClientState = state;
      return client.sendMessage("invalid-destination", "pooballs");
    }).then(dead).catch(function(err) {
      expect(err.errcode).toEqual("SEND_INVALIDDESTINATION");
      return client.logout();
    }).then(done);
  });
 
};

