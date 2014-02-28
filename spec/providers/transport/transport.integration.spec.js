describe("transport.webrtc.json", function() {
  var TIMEOUT = 3000;
  var freedom, helper;

  beforeEach(function() {
    freedom = setupModule("relative://spec/helper/providers.json");
    helper = new ProviderHelper(freedom);
  });

  afterEach(function() {
    cleanupIframes();
  });
  
  it("generates signals", function(done) {
    var ids = {};
    var chanId = undefined;
    var signals = [];
    helper.createProvider("t", "transport.webrtc");
    helper.createChannel(function(newChanId) {
      chanId = newChanId;
      helper.setChannelCallback(chanId, function(msg) {
        signals.push(msg);
        expect(signals.length).toBeGreaterThan(0);
        done();
      });
      var sendData = helper.str2ab("HI");
      ids[0] = helper.call('t', "setup", ["t", chanId]);
      ids[1] = helper.call('t', "send", ["tag", sendData]);
    });
  });

  it("sends data", function(done) {
    var testString = "Hi";
    var ids = {};
    var signals = [];
    var chanId1 = undefined;
    var chanId2 = undefined;
    var doSend;
    
    helper.createProvider("t1", "transport.webrtc");
    helper.createProvider("t2", "transport.webrtc");
    helper.createChannel(function(newChanId) {
      chanId1 = newChanId;
      if (chanId2) {
        doSend()
      }
    });
    helper.createChannel(function(newChanId) {
      chanId2 = newChanId;
      if (chanId1) {
        doSend();
      }
    });

    doSend = function() {
      helper.on("t2", "onData", function(result) {
        var resultStr = helper.ab2str(result.data);
        expect(signals.length).toBeGreaterThan(0);
        expect(result.data instanceof ArrayBuffer).toBe(true);
        expect(result.tag).toEqual("tag");
        done();
      });

      helper.setChannelCallback(chanId1, function(msg) {
        signals.push(msg);
        helper.sendToChannel(chanId2, msg);
      });
      helper.setChannelCallback(chanId2, function(msg) {
        signals.push(msg);
        helper.sendToChannel(chanId1, msg);
      });
      var sendData = helper.str2ab(testString);
      ids[0] = helper.call("t1", "setup", ["t1", chanId1]);
      ids[1] = helper.call("t2", "setup", ["t2", chanId2]);
      ids[2] = helper.call("t1", "send", ["tag", sendData]);
    };
  });
});
