var TRANSPORT_SPEC = function(transportId) { return function() {
  var TIMEOUT = 1000;
  var freedom, helper;

  function ab2str(buf) {
    return String.fromCharCode.apply(null, new Uint16Array(buf));
  }
  function str2ab(str) {
    var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
    var bufView = new Uint16Array(buf);
    for (var i=0, strLen=str.length; i<strLen; i++) {
      bufView[i] = str.charCodeAt(i);
    }
    return buf;
  }

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
      var sendData = str2ab("HI");
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
    var ids = {};
    var signals = [];
    var chanId1 = undefined;
    var chanId2 = undefined;
    
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
      helper.setChannelCallback(chanId1, function(msg) {
        signals.push(msg);
        //helper.sendToChannel(chanId2, msg);
      });
      helper.setChannelCallback(chanId2, function(msg) {
        signals.push(msg);
        //helper.sendToChannel(chanId1, msg);
      });
      var sendData = str2ab("HI");
      ids[0] = helper.call('t1', "setup", ["t1", chanId1]);
      //ids[1] = helper.call('t2', "setup", ["t2", chanId2]);
      ids[2] = helper.call('t1', "send", ["tag", sendData]);
    });
    waitsFor("signalling messages", function() {
      return signals.length > 0;
    }, TIMEOUT);

    runs(function() {
      console.log(signals);
      expect(signals.length).toBeGreaterThan(0);
    });

  });



}};

describe("transport.webrtc.json", TRANSPORT_SPEC("transport.webrtc"));
