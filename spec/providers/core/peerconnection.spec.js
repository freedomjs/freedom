function webkitRTCPeerConnection(configuration, constraints) {
  this.configuration = configuration;
  this.constraints = constraints;
}

webkitRTCPeerConnection.prototype.addEventListener = function(event, func) {
};

describe("providers/core/peerconnection", function() {
  var portApp, events, emitted, listeningOn;
  var peerconnection;
  var turnServers = [];
  var PROXY = "PROXY";
  var TIMEOUT = 1000;
  

    function Core () {
    };

    Core.prototype.bindChannel = function(id, continuation) {
      console.info("bind channel");
      continuation(events);
    };

  function setup() {
    var setupCompletes = false;
    function setupCalled() {
      setupCompletes = true;
    }
    peerconnection.setup(PROXY, "setup peer", turnServers, setupCalled);
    waitsFor(function() {
      return setupCompletes;
    }, TIMEOUT);
    runs(function() {
      expect(emitted).toContain({eventName: "ready"});
    });
  }

  beforeEach(function beforeEach() {
    emitted = [];
    listeningOn = {};

    events = {
      emit: function(eventName, eventData) {
        emitted.push({eventName: eventName,
                      eventData: eventData});
      },
      on: function(event, func) {
        listeningOn[event] = func;
      }
    };

    portApp = {
      once: function(name, func) {
        expect(name).toEqual("core");
        func(Core);
      },
      emit: function() {
      }
    };
    peerconnection = new PeerConnection(portApp);
  });

  it("sets up.", setup);

  it("handles signaling messages.", function() {
    setup();
    listeningOn.message();
  });
  
});
