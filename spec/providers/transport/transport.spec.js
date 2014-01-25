var TRANSPORT_SPEC = function(transportId) { return function() {
  var TIMEOUT = 1000;
  var freedom;
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
      freedom.emit("create", {
        name: "t",
        provider: transportId
      });
      helper.createChannel(function(newChanId) {
        chanId = newChanId;
      });
    });
    waitsFor("create channel", function() {
      return chanId != undefined; 
    }, TIMEOUT);

    runs(function() {
      helper.setChannelCallback(chanId, function(msg) {
        console.log(msg);
        signals.push(msg);
      });
      var ab = str2ab("HI");
      console.log(ab instanceof ArrayBuffer);
      ids[0] = helper.call('t', "setup", ["t", chanId]);
      ids[1] = helper.call('t', "send", ["tag", str2ab("Hi")]);
    });
    waitsFor("signalling messages", function() {
      return signals.length > 0;
    }, TIMEOUT);

    runs(function() {
      expect(signals.length).toBeGreaterThan(0);
    });

  });


/**
  it("can setup", function() {
    var p1 = proxy();
    var p2 = proxy();
    var core = undefined; 
    var chan1 = undefined;
    var chan2 = undefined;
    var val = undefined;

    waitsFor("freedom to be set", function() {
      return typeof freedom !== "undefined";
    }, TIMEOUT);

    runs(function (){
      core = freedom.core();
      core.createChannel().done(function (chan) {
        console.log("Chan1 done");
        chan.channel.on('ready', function(){console.log("p1ready");});
        chan.channel.on('message', function(msg) {
          console.log("2->1")
          console.log(msg);
          chan2.channel.emit("message", msg);
        });
        chan1 = chan;
      });
      core.createChannel().done(function (chan) {
        console.log("Chan2 done");
        chan.channel.on('ready', function(){console.log("p2ready");});
        chan.channel.on('message', function(msg) {
          console.log("1->2")
          console.log(msg);
          chan1.channel.emit("message", msg);
        });
        chan2 = chan;
      });
    });
    waitsFor("create channels", function() {
      return ((chan1 !== undefined) && (chan2 !== undefined));
    }, TIMEOUT);

    runs(function() {
      p1.on('onData', function(msg) {
        console.warn(msg);
        val = msg;
      });
      p1.setup("p1", chan1.identifier);
      p2.setup("p2", chan2.identifier);
      p1.send('tag', 'test');
    });
    waitsFor("value to transmit", function() {
      return val != undefined;
    }, TIMEOUT);
    
    runs(function() {
      expect(val.tag).toEqual('test');
    });




  });

**/

}};

describe("transport.webrtc.json", TRANSPORT_SPEC("transport.webrtc"));
