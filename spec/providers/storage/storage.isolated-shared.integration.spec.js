describe("storage.isolated.json - storage.shared.json", function() {
  var freedom, helper;

  beforeEach(function(done) {
    freedom = setupModule("relative://spec/helper/providers.json");
    helper = new ProviderHelper(freedom);
    helper.createProvider("shared", "storage.shared");
    helper.createProvider("isolated", "storage.isolated");
    helper.call("shared", "clear", [], done);
  });
  
  afterEach(function() {
    cleanupIframes();
  });

  it("isolates partitions", function(done) {
    var callbackOne = function(ret) {
      helper.call('isolated', "set", ["key1", "value1"], callbackTwo);
    };
    var callbackTwo = function(ret) {
      helper.call('isolated', "set", ["key2", "value2"], callbackThree);
    };
    var callbackThree = function(ret) {
      helper.call('isolated', "keys", [], callbackFour);
    };
    var callbackFour = function(ret) {
      expect(ret.length).toEqual(2);
      expect(ret).toContain("key1");
      expect(ret).toContain("key2");
      helper.call('shared', "keys", [], callbackFive);
    };
    var callbackFive = function(ret) {
      expect(ret.length).toEqual(3);
      helper.call("shared", "clear", [], done);
    };
    helper.call('shared', "set", ["outerKey", "outerValue"], callbackOne);
  });

});
