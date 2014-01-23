describe("websocket-server integration", function() {
  var freedom_src;

  var freedom, dir;
  beforeEach(function() {
    freedom_src = getFreedomSource();
    var global = {
      // console: {
      //   log: function() {}
      // }
      // console: console
    };
    setupResolvers();
    
    var path = window.location.href,
        dir_idx = path.lastIndexOf('/');
    dir = path.substr(0, dir_idx) + '/';
    freedom = setup(global, undefined, {
      manifest: "relative://spec/providers/social/websocket-server.integration.spec.json",
      portType: 'Frame',
      inject: dir + "node_modules/es5-shim/es5-shim.js",
      src: freedom_src
    });

    // We need to make sure the app is setup up and ready
    freedom.emit("ws-ready");
    var ready = false;
    
    freedom.on("ws-app-ready", function() {
      ready = true;
    });
    waitsFor(function iframesLoaded() {
      return ready;
    }, 5000);
  });
  
  afterEach(function() {
    var frames = document.getElementsByTagName('iframe');
    for (var i = 0; i < frames.length; i++) {
      frames[i].parentNode.removeChild(frames[i]);
    }
  });

  it("test", function() {
    var frames;
    waitsFor(function() {
      frames = Array.prototype.slice.call(document.getElementsByTagName('iframe'));
      return (frames.length > 0 &&
              (frames[0].contentDocument !== null ||
               frames[0].contentWindow !== null));

    }, 1000);
    runs(function() {
      var i;
      // These log messages always print undefined, it doesn't look
      // like freedom is defined.
      for (i = 0; i < frames.length; i++) {
        console.log(typeof frames[i].contentDocument.freedom);
        console.log(typeof frames[i].contentWindow.document.freedom);
      }
    });
  });
});
