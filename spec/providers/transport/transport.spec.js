var TRANSPORT_SPEC = function(manifest_url) { return function() {
  var proxy;
  var TIMEOUT = 1000;
  beforeEach(function() {
    proxy = createProxyFor(manifest_url, "transport");
  });

  it("can setup", function() {
    var p1 = proxy();
    var p2 = proxy();
    var core = freedom.core();
    var chan1 = undefined;
    var chan2 = undefined;
    var val = undefined;

    runs(function (){
      core.createChannel().done(function (chan) {
        chan.channel.on('message', function(msg) {
          console.log("2->1")
          console.log(msg);
          chan2.channel.emit("message", msg);
        });
        chan1 = chan;
      });
      core.createChannel().done(function (chan) {
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
      p2.send('asdf', 'test');
    });
    waitsFor("value to transmit", function() {
      return val != undefined;
    }, TIMEOUT);
    
    runs(function() {
      expect(val.tag).toEqual('asdf');
    });




  });

}};

describe("transport.webrtc.json", TRANSPORT_SPEC("providers/transport/webrtc/transport.webrtc.json"));
