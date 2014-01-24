describe("websocket-server integration", function() {
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
    //spyOn(helper, 'ret').andCallThrough();
    freedom.on('return', helper.ret);
  });
  
  afterEach(function() {
    cleanupIframes();
  });
 
});
