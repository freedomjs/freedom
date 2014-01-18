/**
describe("storage.isolated.json - storage.shared.json", function() {
  var proxyShared;
  var proxyIsolated;
  var TIMEOUT = 1000;
  beforeEach(function() {
    proxyIsolated = createProxyFor("providers/storage/isolated/storage.isolated.json", "storage");
    proxyShared = createProxyFor("providers/storage/shared/storage.shared.json", "storage");
  });

  it("isolates partitions", function() {
    var isolatedStorage = proxyIsolated();
    var sharedStorage = proxyShared();
    var val = undefined;
    var done = false;

    runs(function() {
      sharedStorage.set("outerKey", "outerValue").done(function(){
        isolatedStorage.set("key1", "value1").done(function() {
          isolatedStorage.set("key2", "value2").done(function() {
            done = true;
          });
        });
      });
    });
    waitsFor("setup", function() {
      return done == true;
    }, TIMEOUT);

    runs(function() {
      done = false;
      isolatedStorage.keys().done(function(ret) {
        val = ret;
      });
    });
    waitsFor("keys to be retrieved", function() {
      return val != undefined;
    }, TIMEOUT);

    runs(function() {
      expect(val.length).toEqual(2);
      expect(val).toContain("key1");
      expect(val).toContain("key2");
      val = undefined;
      sharedStorage.keys().done(function(ret) {
        val = ret;
      });
    });
    waitsFor("sharedStorage keys", function() {
      return val != undefined;
    }, TIMEOUT);

    runs(function() {
      expect(val.length).toEqual(3);
      sharedStorage.clear().done(function() {
        done = true;
      });
    });
    waitsFor("cleanup", function(){
      return done == true;
    }, TIMEOUT);

  });
});
**/
