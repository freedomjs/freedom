var STORAGE_INTEGRATION_SPEC = function(storageId) { 
  var freedom, helper;

  beforeEach(function(done) {
    freedom = setupModule("relative://spec/helper/providers.json");
    helper = new ProviderHelper(freedom);
    helper.createProvider("s", storageId);
    helper.call("s", "clear", [], done);
  });

  afterEach(function() {
    cleanupIframes();
  });

  it("sets and gets keys", function(done) {
    var callbackOne = function(ret) {
      helper.call("s", "get", ["key"], callbackTwo);
    };
    var callbackTwo = function(ret) {
      expect(ret).toEqual("myvalue");
      helper.call("s", "clear", [], done);
    };
    helper.call("s", "set", ["key", "myvalue"], callbackOne);
  });

  it("removes a key", function(done) {
    var callbackOne = function(ret) {
      helper.call("s", "remove", ["key"], callbackTwo);
    };
    var callbackTwo = function(ret) {
      helper.call("s", "keys", [], callbackThree);
    };
    var callbackThree = function(ret) {
      expect(ret).toEqual([]);
      helper.call("s", "clear", [], done);
    };
    helper.call("s", "set", ["key", "myvalue"], callbackOne);
  });

  it("lists keys that have been set", function(done) {
    var callbackOne = function(ret) {
      helper.call("s", "set", ["k2", "v2"], callbackTwo);
    };
    var callbackTwo = function(ret) {
      helper.call("s", "keys", [], callbackThree);
    };
    var callbackThree = function(ret) {
      expect(ret.length).toEqual(2);
      expect(ret).toContain("k1");
      expect(ret).toContain("k2");
      helper.call("s", "clear", [], done);
    };
    helper.call("s", "set", ["k1", "v1"], callbackOne);
  });

  it("clears the store", function(done) {
    var callbackOne = function(ret) {
      helper.call("s", "clear", [], callbackTwo);
    };
    var callbackTwo = function(ret) {
      helper.call("s", "keys", [], callbackThree);
    };
    var callbackThree = function(ret) {
      expect(ret.length).toEqual(0);
      done();
    };
    helper.call("s", "set", ["key", "value"], callbackOne);
  });

  it("shares data between different instances", function(done) {
    var callbackOne = function(ret) {
      helper.call("s2", "get", ["key"], callbackTwo);
    };
    var callbackTwo = function(ret) {
      expect(ret).toEqual("value");
      helper.call("s", "clear", [], callbackThree);
    };
    var callbackThree = function(ret) {
      helper.call("s2", "clear", [], done);
    };
    helper.createProvider("s2", storageId);
    helper.call("s", "set", ["key", "value"], callbackOne);
  });
};

describe("integration: storage.isolated.json", STORAGE_INTEGRATION_SPEC.bind(this, "storage.isolated"));
describe("integration: storage.shared.json", STORAGE_INTEGRATION_SPEC.bind(this, "storage.shared"));
