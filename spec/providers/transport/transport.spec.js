var TRANSPORT_SPEC = function(transportId) { return function() {
  var TIMEOUT = 1000;
  var freedom;

  beforeEach(function() {
    freedom = setupModule("relative://spec/helper/providers.json");
  });

  afterEach(function() {
    cleanupIframes();
  });
  
  it("is all good in the hood", function() {expect(true).toEqual(true)});

  it("can setup", function() {
    runs(function() {
    
    });
    waitsFor("", function() {}, TIMEOUT);
  
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
