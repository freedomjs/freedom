var INTEGRATIONTEST;
if (typeof INTEGRATIONTEST == 'undefined') {
  INTEGRATIONTEST = {};
}

INTEGRATIONTEST.storage = function(provider_url) {
  INTEGRATIONTEST._storage(provider_url, false);
};

INTEGRATIONTEST.storebuffer = function(provider_url) {
  INTEGRATIONTEST._storage(provider_url, true);
};

INTEGRATIONTEST._storage = function(provider_url, useArrayBuffer) { 
  var helper;

  function beforeSet(str) {
    if (typeof useArrayBuffer == 'undefined' || useArrayBuffer == false) {
      return str;
    } else {
      var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
      var bufView = new Uint16Array(buf);
      for (var i=0, strLen=str.length; i<strLen; i++) {
        bufView[i] = str.charCodeAt(i);
      }
      return buf;
    }
  }

  function afterGet(val) {
    if (val == null) {
      return null;
    } else if (typeof useArrayBuffer == 'undefined' || useArrayBuffer == false) {
      return val;
    } else {
      return String.fromCharCode.apply(null, new Uint16Array(val));
    }
  }

  beforeEach(function(done) {
    if (typeof useArrayBuffer == 'undefined' || useArrayBuffer == false) {
      helper = providerFor(provider_url, "storage")
    } else {
      helper = providerFor(provider_url, "storebuffer")
    }
    helper.create("s");
    helper.call("s", "clear", [], done);
  });

  afterEach(function() {
    helper.removeListeners("s");
    cleanupIframes();
  });
  
  it("sets and gets keys", function(done) {
    var callbackOne = function(ret) {
      helper.call("s", "get", ["key-a"], callbackTwo);
    };
    var callbackTwo = function(ret) {
      expect(afterGet(ret)).toEqual("value-a");
      helper.call("s", "clear", [], done);
    };
    helper.call("s", "set", ["key-a", beforeSet("value-a")], callbackOne);
  });

  it("set returns old value", function(done) {
    var callbackOne = function(ret) {
      expect(afterGet(ret)).toEqual(null);
      helper.call("s", "set", ["key-b", beforeSet("value2-b")], callbackTwo);
    };
    var callbackTwo = function(ret) {
      expect(afterGet(ret)).toEqual("value1-b");
      helper.call("s", "clear", [], done);
    };
    helper.call("s", "set", ["key-b", beforeSet("value1-b")], callbackOne);
  
  });

  it("removes a key", function(done) {
    var callbackOne = function(ret) {
      helper.call("s", "remove", ["key-c"], callbackTwo);
    };
    var callbackTwo = function(ret) {
      expect(afterGet(ret)).toEqual("myvalue-c");
      helper.call("s", "keys", [], callbackThree);
    };
    var callbackThree = function(ret) {
      expect(ret).toEqual([]);
      helper.call("s", "clear", [], done);
    };
    helper.call("s", "set", ["key-c", beforeSet("myvalue-c")], callbackOne);
  });

  it("lists keys that have been set", function(done) {
    var callbackOne = function(ret) {
      helper.call("s", "set", ["k2-d", beforeSet("v2-d")], callbackTwo);
    };
    var callbackTwo = function(ret) {
      helper.call("s", "keys", [], callbackThree);
    };
    var callbackThree = function(ret) {
      expect(ret.length).toEqual(2);
      expect(ret).toContain("k1-d");
      expect(ret).toContain("k2-d");
      helper.call("s", "clear", [], done);
    };
    helper.call("s", "set", ["k1-d", beforeSet("v1-d")], callbackOne);
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
    helper.call("s", "set", ["key-e", beforeSet("value-e")], callbackOne);
  });

  //@todo - not sure if this is even desired behavior
  xit("shares data between different instances", function(done) {
    var callbackOne = function(ret) {
      helper.call("s2", "get", ["key"], callbackTwo);
    };
    var callbackTwo = function(ret) {
      expect(afterGet(ret)).toEqual("value");
      helper.call("s", "clear", [], callbackThree);
    };
    var callbackThree = function(ret) {
      helper.call("s2", "clear", [], done);
    };
    helper.create("s2");
    helper.call("s", "set", ["key", beforeSet("value")], callbackOne);
  });
};

