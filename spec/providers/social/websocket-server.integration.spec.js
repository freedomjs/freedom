describe("websocket-server integration", function() {
  var freedom_src;

  var freedom, dir;
  var socialA, socialB;
  beforeEach(function() {
    freedom_src = getFreedomSource();
    var global = {
      console: {
        log: function() {}
      }
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
    var frames;
    waitsFor(function() {
      frames = Array.prototype.slice.call(document.getElementsByTagName('iframe'));
      return (frames.length > 1 &&
              (frames[0].contentDocument !== null ||
               frames[0].contentWindow !== null));

    }, 1000);
    runs(function() {
      socialA = frames[0].contentWindow.freedom.social();
      socialB = frames[0].contentWindow.freedom.social();
      expect(socialA).not.toBe(socialB);
    });
  });
  
  afterEach(function() {
    var frames = document.getElementsByTagName('iframe');
    for (var i = 0; i < frames.length; i++) {
      frames[i].parentNode.removeChild(frames[i]);
    }
  });

  it("Both log in", function() {
    var loginInfo = {};
    function loginCallbackFactory(social) {
      return function (status) {
        expect(status).not.toBe(undefined);
        expect(status).not.toBe(null);
        expect(status.status).toEqual(3);
        expect(status.userId).toEqual(jasmine.any(String));
        loginInfo[social] = status.userId;
      };
    }
    socialA.login({network: "websockets",
                   agent: "jasmine"}).done(loginCallbackFactory("A"));
    socialB.login({network: "websockets",
                   agent: "jasmine"}).done(loginCallbackFactory("B"));

    waitsFor(function waitForLogin() {
      return (typeof loginInfo.A !== "undefined" &&
              typeof loginInfo.B !== "undefined");
    }, 1000);

    socialB.on("onMessage", function(message) {
      console.log("socialB got a message.");
      console.log(message);
    });

    runs(function() {
      console.log(JSON.stringify(loginInfo));
      socialA.sendMessage(loginInfo.B, "Hello B, this is A");
    }, 1000);
  });
});
