describe("storage.isolated.json - storage.shared.json", function() {
  var TIMEOUT = 1000;
  var freedom, helper;

  beforeEach(function() {
    freedom = setupModule("relative://spec/helper/providers.json");
    helper = new ProviderHelper(freedom);
    helper.createProvider("shared", "storage.shared");
    helper.createProvider("isolated", "storage.isolated");
  });
  
  afterEach(function() {
    cleanupIframes();
  });

  it("isolates partitions", function() {
    var ids = {};
    runs(function() {
      ids[0] = helper.call('shared', "set", ["outerKey", "outerValue"]);
      ids[1] = helper.call('isolated', "set", ["key1", "value1"]);
      ids[2] = helper.call('isolated', "set", ["key2", "value2"]);
    });
    waitsFor("setup", function() {
      return helper.hasReturned(ids); 
    }, TIMEOUT);

    runs(function() {
      ids[3] = helper.call('isolated', "keys", []);
      ids[4] = helper.call('shared', "keys", []);
    });
    waitsFor("get keys", function() {
      return helper.hasReturned(ids);
    }, TIMEOUT);

    runs(function() {
      expect(helper.returns[ids[3]].length).toEqual(2);
      expect(helper.returns[ids[3]]).toContain("key1");
      expect(helper.returns[ids[3]]).toContain("key2");
      expect(helper.returns[ids[4]].length).toEqual(3);
      ids[5] = helper.call("shared", "clear", []);
    });
    waitsFor("cleanup", function() {
      return helper.hasReturned(ids);
    }, TIMEOUT);
  });

});
