describe("core.storage unprivileged", function() {
  var provider;
  var TIMEOUT = 1000;
  
  beforeEach(function(done) {
    if (typeof chrome !== "undefined" && 
        typeof chrome.storage !== "undefined" &&
        typeof chrome.storage.local !== "undefined") {
      chrome.storage.local.clear();
      provider = new Storage_chromeStorageLocal({});
    } else {
      localStorage.clear();
      provider = new Storage_unprivileged({});
    }
    done();
  });
  
  it("Deals with Keys appropriately", function(done) {
    var callbackOne = function(ret) {
      expect(ret).toEqual([]);
      provider.get('myKey', callbackTwo);
    };
    var callbackTwo = function(ret) {
      expect(ret).toEqual(null);
      provider.set('myKey', 'myVal', callbackThree);
    };
    var callbackThree = function(ret) {
      provider.get('myKey', callbackFour);
    }
    var callbackFour = function(ret) {
      expect(ret).toEqual('myVal');
      provider.keys(callbackFive);
    };
    var callbackFive = function(ret) {
      expect(ret).toEqual(['myKey']);
      provider.remove('myKey', callbackSix);
    }
    var callbackSix = function(ret) {
      provider.get('myKey', callbackSeven);
    };
    var callbackSeven = function(ret) {
      expect(ret).toEqual(null);
      done();
    };
    provider.keys(callbackOne);
  });

  it("Clears Items", function(done) {
    var callbackOne = function(ret) {
      provider.set('otherKey', 'otherValue', callbackTwo);
    };
    var callbackTwo = function(ret) {
      provider.clear(callbackThree);
    };
    var callbackThree = function(ret) {
      provider.get('myKey', callbackFour);
    };
    var callbackFour = function(ret) {
      expect(ret).toEqual(null);
      provider.get('otherKey', callbackFive);
    };
    var callbackFive = function(ret) {
      expect(ret).toEqual(null);
      done();
    }
    provider.set('myKey', 'myVal', callbackOne);
    
  });
});
