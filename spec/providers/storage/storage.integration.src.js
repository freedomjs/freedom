
module.exports = function(freedom, provider_url, freedomOpts, useArrayBuffer) { 
  var Storage, client, ERRCODE;

  var util = {
    beforeSet: function (str) {
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
    },
    afterGet: function(val) {
      if (val == null) {
        return null;
      } else if (typeof useArrayBuffer == 'undefined' || useArrayBuffer == false) {
        return val;
      } else {
        return String.fromCharCode.apply(null, new Uint16Array(val));
      }
    }
  }

  beforeEach(function(done) {
    freedom(provider_url, freedomOpts).then(function(constructor) {
      Storage = constructor;
      client = new Storage();
      ERRCODE = client.ERRCODE;
      client.clear().then(done);
    });
  });

  afterEach(function() {
    Storage.close(client);
    done();
  });
  
  it("sets and gets keys", function(done) {
    client.set("k-a", util.beforeSet("v-a")).then(function(ret) {
      return client.get("k-a");
    }).then(function(ret) {
      expect(util.afterGet(ret)).toEqual("v-a");
      return client.clear();
    }).then(done);
  });

  it("set returns old value", function(done) {
    client.set("k-b", util.beforeSet("v1-b")).then(function(ret) {
      expect(util.afterGet(ret)).toEqual(null);
      return client.set("k-b", util.beforeSet("v2-b"));
    }).then(function(ret) {
      expect(util.afterGet(ret)).toEqual("v1-b");
      return client.clear();
    }).then(done);
  });

  it("removes a key", function(done) {
    var callbackOne = function(ret) {
      helper.call("s", "remove", ["key-c"], callbackTwo);
    };
    var callbackTwo = function(ret) {
      expect(util.afterGet(ret)).toEqual("myvalue-c");
      helper.call("s", "keys", [], callbackThree);
    };
    var callbackThree = function(ret) {
      expect(ret).toEqual([]);
      helper.call("s", "clear", [], done);
    };
    helper.call("s", "set", ["key-c", util.beforeSet("myvalue-c")], callbackOne);
  });

  it("lists keys that have been set", function(done) {
    var callbackOne = function(ret) {
      helper.call("s", "set", ["k2-d", util.beforeSet("v2-d")], callbackTwo);
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
    helper.call("s", "set", ["k1-d", util.beforeSet("v1-d")], callbackOne);
  });
  
  it("resolves 'null' when getting unset keys", function (done) {
    var callbackOne = function (ret) {
      expect(ret).toEqual(null);
      done();
    };
    helper.call("s", "get", ["ku"], callbackOne, function(err) {
      console.error(err);
      expect(1).toEqual(2);
      done();
    });
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
    helper.call("s", "set", ["key-e", util.beforeSet("value-e")], callbackOne);
  });

  it("sets work across keys", function(done) {
    var callbackOne = function(ret) {
      expect(util.afterGet(ret)).toEqual(null);
      helper.call("s", "set", ["key2-f", util.beforeSet("value1-f")], callbackTwo);
    };
    var callbackTwo = function(ret) {
      expect(util.afterGet(ret)).toEqual(null);
      helper.call("s", "set", ["key1-f", util.beforeSet("value2-f")], callbackThree);
    };
    var callbackThree = function(ret) {
      expect(util.afterGet(ret)).toEqual("value1-f");
      helper.call("s", "set", ["key2-f", util.beforeSet("value1-f")], callbackFour);
    };
    var callbackFour = function(ret) {
      expect(util.afterGet(ret)).toEqual("value1-f");
      helper.call("s", "get", ["key1-f"], callbackFive);
    };
    var callbackFive = function(ret) {
      expect(util.afterGet(ret)).toEqual("value2-f");
      helper.call("s", "clear", [], done);
    };
    helper.call("s", "set", ["key1-f", util.beforeSet("value1-f")], callbackOne);
  });

  //@todo - not sure if this is even desired behavior
  xit("shares data between different instances", function(done) {
    var callbackOne = function(ret) {
      helper.call("s2", "get", ["key"], callbackTwo);
    };
    var callbackTwo = function(ret) {
      expect(util.afterGet(ret)).toEqual("value");
      helper.call("s", "clear", [], callbackThree);
    };
    var callbackThree = function(ret) {
      helper.call("s2", "clear", [], done);
    };
    helper.create("s2");
    helper.call("s", "set", ["key", util.beforeSet("value")], callbackOne);
  });
};

