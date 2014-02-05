var STORAGE_INTEGRATION_SPEC = function(storageId) { return function() {
  var TIMEOUT = 1000;
  var freedom, helper;

  beforeEach(function() {
    freedom = setupModule("relative://spec/helper/providers.json");
    helper = new ProviderHelper(freedom);
    helper.createProvider("s", storageId);
  });

  afterEach(function() {
    cleanupIframes();
  });

  it("sets and gets keys", function() {
    var ids = {};

    runs(function() {
      ids[0] = helper.call("s", "set", ["key", "myvalue"]);
      ids[1] = helper.call("s", "get", ["key"]);
    });
    waitsFor("Key to be round-tripped", helper.hasReturned.bind(helper,ids), TIMEOUT); 

    runs(function() {
      expect(helper.returns[ids[1]]).toEqual("myvalue");
      ids[2] = helper.call("s", "clear", []);
    });
    waitsFor("cleanup", helper.hasReturned.bind(helper,ids), TIMEOUT); 
  });

  it("removes a key", function() {
    var ids = {};

    runs(function() {
      ids[0] = helper.call("s", "set", ["key", "myvalue"]);
      ids[1] = helper.call("s", "remove", ["key"]);
      ids[2] = helper.call("s", "keys", []);
    });
    waitsFor("keys to be returned", helper.hasReturned.bind(helper,ids), TIMEOUT); 

    runs(function() {
      expect(helper.returns[ids[2]]).toEqual([]);
      ids[3] = helper.call("s", "clear", []);
    });
    waitsFor("cleanup", helper.hasReturned.bind(helper,ids), TIMEOUT); 
  });

  it("lists keys that have been set", function() {
    var ids = {};

    runs(function() {
      ids[0] = helper.call("s", "set", ["k1", "v1"]);
      ids[1] = helper.call("s", "set", ["k2", "v2"]);
      ids[2] = helper.call("s", "keys", []);
    });
    waitsFor("keys to be returned", helper.hasReturned.bind(helper,ids), TIMEOUT); 

    runs(function() {
      expect(helper.returns[ids[2]].length).toEqual(2);
      expect(helper.returns[ids[2]]).toContain("k1");
      expect(helper.returns[ids[2]]).toContain("k2");
      ids[3] = helper.call("s", "clear", []);
    });
    waitsFor("cleanup", helper.hasReturned.bind(helper,ids), TIMEOUT); 
  });

  it("clears the store", function() {
    var ids = {};

    runs(function() {
      ids[0] = helper.call("s", "set", ["key", "value"]);
      ids[1] = helper.call("s", "clear", []);
    });
    waitsFor("keys to be cleared", helper.hasReturned.bind(helper,ids), TIMEOUT); 

    runs(function() {
      ids[2] = helper.call("s", "keys", []);
    });
    waitsFor("keys to be returned", helper.hasReturned.bind(helper,ids), TIMEOUT); 

    runs(function() {
      expect(helper.returns[ids[2]].length).toEqual(0);
    });
  });

  it("shares data between different instances", function() {
    var ids = {};

    runs(function() {
      helper.createProvider("s2", storageId);
      ids[0] = helper.call("s", "set", ["key", "value"]);
      ids[1] = helper.call("s2", "get", ["key"]);
    });
    waitsFor("keys to be returned", helper.hasReturned.bind(helper,ids), TIMEOUT); 

    runs(function() {
      expect(helper.returns[ids[1]]).toEqual("value");
      ids[2] = helper.call("s", "clear", []);
      ids[3] = helper.call("s2", "clear", []);
    });
    waitsFor("cleanup", helper.hasReturned.bind(helper,ids), TIMEOUT); 
  });
}};

describe("integration: storage.isolated.json", STORAGE_INTEGRATION_SPEC("storage.isolated"));
describe("integration: storage.shared.json", STORAGE_INTEGRATION_SPEC("storage.shared"));
