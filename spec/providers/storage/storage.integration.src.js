var Promise = require("es6-promise").Promise;
module.exports = function(freedom, provider_url, freedomOpts, useArrayBuffer) { 
  var Storage, ERRCODE;
  var client = null;
  
  beforeEach(function(done) {
    var complete = function() {
      client = new Storage();
      ERRCODE = client.ERRCODE;
      client.clear().then(done);
    };
    // Only create a freedom module the first time
    // Fails on Firefox otherwise
    if (typeof Storage === "undefined") {
      freedom(provider_url, freedomOpts).then(function(constructor) {
        Storage = constructor;
        complete();
      });  
    } else {
      complete();
    }
  });

  afterEach(function(done) {
    //Storage.onClose(client, done);
    client.clear().then(function () {
      Storage.close(client);
      client = null;
      done();
    });
  });

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

  function errHandler(err) {
    console.error(err);
    expect(err).toBeUndefined();
  }

  it("sets and gets keys", function(done) {
    client.set("k-a", util.beforeSet("v-a")).then(function(ret) {
      return client.get("k-a");
    }).then(function(ret) {
      expect(util.afterGet(ret)).toEqual("v-a");
      done();
    }).catch(errHandler);
  });

  it("set returns old value", function(done) {
    client.set("k-b", util.beforeSet("v1-b")).then(function(ret) {
      expect(util.afterGet(ret)).toEqual(null);
      return client.set("k-b", util.beforeSet("v2-b"));
    }).then(function(ret) {
      expect(util.afterGet(ret)).toEqual("v1-b");
      done();
    }).catch(errHandler);
  });

  it("removes a key", function(done) {
    client.set("k-c", util.beforeSet("v-c")).then(function(ret) {
      return client.remove("k-c");
    }).then(function(ret) {
      expect(util.afterGet(ret)).toEqual("v-c");
      return client.keys();
    }).then(function(ret) {
      expect(ret).toEqual([]);
      done();
    }).catch(errHandler);
  });

  it("lists keys that have been set", function(done) {
    client.set("k1-d", util.beforeSet("v1-d")).then(function(ret) {
      return client.set("k2-d", util.beforeSet("v2-d"));
    }).then(function(ret) {
      return client.keys();
    }).then(function(ret) {
      expect(ret.length).toEqual(2);
      expect(ret).toContain("k1-d");
      expect(ret).toContain("k2-d");
      done();
    }).catch(errHandler);
  });
  
  it("resolves 'null' when getting unset keys", function (done) {
    client.get("ku").then(function(ret) {
      expect(ret).toEqual(null);
      done();
    }).catch(errHandler);
  });

  it("clears the store", function(done) {
    client.set("k-e", util.beforeSet("v-e")).then(function(ret) {
      return client.clear();
    }).then(function(ret) {
      return client.keys();
    }).then(function(ret) {
      expect(ret.length).toEqual(0);
      done();
    }).catch(errHandler);
  });

  it("sets work across keys", function(done) {
    Promise.all([
      client.set("k1-f", util.beforeSet("v1-f")),
      client.set("k2-f", util.beforeSet("v1-f"))
    ]).then(function(ret) {
      expect(util.afterGet(ret[0])).toEqual(null);
      expect(util.afterGet(ret[1])).toEqual(null);
      return client.set("k1-f", util.beforeSet("v2-f"));
    }).then(function(ret) {
      expect(util.afterGet(ret)).toEqual("v1-f");
      return client.set("k2-f", util.beforeSet("v1-f"));
    }).then(function(ret) {
      expect(util.afterGet(ret)).toEqual("v1-f");
      return client.get("k1-f");
    }).then(function(ret) {
      expect(util.afterGet(ret)).toEqual("v2-f");
      done();
    }).catch(errHandler);
  });

  //@todo - not sure if this is even desired behavior
  xit("shares data between different instances", function(done) {
    var s2 = new Storage();
    client.set("k", util.beforeSet("v")).then(function(ret) {
      return s2.get("k");
    }).then(function(ret) {
      expect(util.afterGet(ret)).toEqual("v");
      return Promise.all([ client.clear(), s2.clear() ]);
    }).then(done).catch(errHandler);
  });
};

