var TRANSPORT_SPEC = function(transportId) { return function() {
  var TIMEOUT = 3000;
  var freedom, helper;

  beforeEach(function() {
    freedom = setupModule("relative://spec/helper/providers.json");
    helper = new ProviderHelper(freedom);
  });

  afterEach(function() {
    cleanupIframes();
  });
  
  it("is all good in the hood", function() {expect(true).toEqual(true)});

  it("generates signals", function() {
    var ids = {};
    var chanId = undefined;
    var signals = [];
    runs(function() {
      helper.createProvider("t", transportId);
      helper.createChannel(function(newChanId) {
        chanId = newChanId;
      });
    });
    waitsFor("create channel", function() {
      return chanId != undefined; 
    }, TIMEOUT);

    runs(function() {
      helper.setChannelCallback(chanId, function(msg) {
        signals.push(msg);
      });
      var sendData = helper.str2ab("HI");
      ids[0] = helper.call('t', "setup", ["t", chanId]);
      ids[1] = helper.call('t', "send", ["tag", sendData]);
    });
    waitsFor("signalling messages", function() {
      return signals.length > 0;
    }, TIMEOUT);

    runs(function() {
      expect(signals.length).toBeGreaterThan(0);
    });
  });

  it("sends data", function() {
    var testString = "Hi";
    var ids = {};
    var signals = [];
    var chanId1 = undefined;
    var chanId2 = undefined;
    var result = undefined;
    
    runs(function() {
      helper.createProvider("t1", transportId);
      helper.createProvider("t2", transportId);
      helper.createChannel(function(newChanId) {
        chanId1 = newChanId;
      });
      helper.createChannel(function(newChanId) {
        chanId2 = newChanId;
      });
    });
    waitsFor("create channels", function() {
      return chanId1 != undefined && chanId2 != undefined;
    }, TIMEOUT);

    runs(function() {
      helper.on("t2", "onData", function(data) {
        result = data;
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
    });
    waitsFor("data received", function() {
      return result != undefined;
    }, TIMEOUT);

    runs(function() {
      var resultStr = helper.ab2str(result.data);
      expect(signals.length).toBeGreaterThan(0);
      expect(result.data instanceof ArrayBuffer).toBe(true);
      expect(result.tag).toEqual("tag");
      //expect(resultStr).toEqual(testString);
      console.log(result);
      console.log(resultStr);
    });

  });


}};

describe("transport.webrtc.json", TRANSPORT_SPEC("transport.webrtc"));
