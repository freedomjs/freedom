function RTCPeerConnection(configuration, constraints) {
  this.configuration = configuration;
  this.constraints = constraints;
}

RTCPeerConnection.prototype.addEventListener = function(event, func) {
};

RTCPeerConnection.setRemoteDescriptionSuccess = true;
RTCPeerConnection.prototype.setRemoteDescription = function(description,
                                                            successCallback,
                                                            failureCallback) {
  if (RTCPeerConnection.setRemoteDescriptionSuccess) {
    this.remoteDescription = description;
    successCallback();
  } else {
    failureCallback();
  }
};

function RTCSessionDescription(descriptionInitDict) {
  this.descriptionInitDict = descriptionInitDict;
}

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

    RTCPeerConnection.setRemoteDescriptionSuccess = true;

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

  it("handles remote offer messages.", function() {
    var message = JSON.stringify({sdp: "v=0"});
    setup();
    listeningOn.message(message);
  });
  
});
