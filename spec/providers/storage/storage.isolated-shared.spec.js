describe("storage.isolated.json - storage.shared.json", function() {
  var TIMEOUT = 1000;
  var freedom;
  var helper = {
    callId: 0,
    returns: {},
    hasReturned: function(ids) {
      for (var key in ids) {
        if (ids.hasOwnProperty(key) && 
            !helper.returns.hasOwnProperty(ids[key])) {
          return false;
        }
      }
      return true;
    },
    call: function(provider, method, args) {
      helper.callId += 1;
      freedom.emit('call', {
        id: helper.callId,
        provider: provider,
        method: method,
        args: args
      });
      return helper.callId;
    },
    ret: function(obj) {
      helper.returns[obj.id] = obj.data;
    }
  };

  beforeEach(function() {
    freedom = setupModule("relative://spec/helper/providers.json");
    freedom.on('return', helper.ret);
    freedom.emit('create', {
      name: 'storage.shared',
      provider: 'storage.shared'
    });
    freedom.emit('create', {
      name: 'storage.isolated',
      provider: 'storage.isolated'
    });
  });
  
  afterEach(function() {
    cleanupIframes();
  });

  it("isolates partitions", function() {
    var ids = {};
    runs(function() {
      ids[0] = helper.call('storage.shared', "set", ["outerKey", "outerValue"]);
      ids[1] = helper.call('storage.isolated', "set", ["key1", "value1"]);
      ids[2] = helper.call('storage.isolated', "set", ["key2", "value2"]);
    });
    waitsFor("setup", function() {
      return helper.hasReturned(ids); 
    }, TIMEOUT);

    runs(function() {
      ids[3] = helper.call('storage.isolated', "keys", []);
      ids[4] = helper.call('storage.shared', "keys", []);
    });
    waitsFor("get keys", function() {
      return helper.hasReturned(ids);
    }, TIMEOUT);

    runs(function() {
      expect(helper.returns[ids[3]].length).toEqual(2);
      expect(helper.returns[ids[3]]).toContain("key1");
      expect(helper.returns[ids[3]]).toContain("key2");
      expect(helper.returns[ids[4]].length).toEqual(3);
      ids[5] = helper.call("storage.shared", "clear", []);
    });
    waitsFor("cleanup", function() {
      return helper.hasReturned(ids);
    }, TIMEOUT);
  });

});
