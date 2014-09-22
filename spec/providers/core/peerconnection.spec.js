var PeerConnection = require('../../../providers/core/peerconnection.unprivileged');

function MockRTCIceCandidate() {
}
function MockRTCPeerConnection(configuration, constraints) {
  MockRTCPeerConnection.mostRecent = this;
  this.configuration = configuration;
  this.constraints = constraints;
  this.listeners = {};
}

MockRTCPeerConnection.prototype.addEventListener = function(event, func) {
  // We only allow registering one listener for simplicity
  this.listeners[event] = func;
};

MockRTCPeerConnection.prototype.createDataChannel = function(label, dict) {
  var dataChannel = new RTCDataChannel(label, dict);
  return dataChannel;
};

MockRTCPeerConnection.prototype.close = function() {
  this.signalingState = 'closed';
};

function RTCDataChannel(label, dict) {
  RTCDataChannel.mostRecent = this;

  this.label = label;
  this.bufferedAmount = 0;
  this.readyState = "connecting";
  this._closed = false;
  setTimeout(function() {
    if (typeof this.onopen === 'function') {
      this.onopen();
    }
  }.bind(this), 0);
}

RTCDataChannel.prototype.send = function() {
};

RTCDataChannel.prototype.close = function() {
  this._closed = true;
};


function MockRTCSessionDescription(descriptionInitDict) {
  this.descriptionInitDict = descriptionInitDict;
  this.sdp = descriptionInitDict.sdp;
  this.type = descriptionInitDict.type;
}

describe("providers/core/peerconnection", function() {
  var portApp, signalChannel, emitted, listeningOn;
  var dispatchedEvents;
  var peerconnection;
  var turnServers = [];
  var PROXY = "PROXY";
  var TIMEOUT = 1000;
  

  function Core () {
  };

  Core.prototype.bindChannel = function(id, continuation) {
    continuation(signalChannel);
  };

  beforeEach(function beforeEach(done) {
    emitted = [];
    listeningOn = {};
    dispatchedEvents = {};

    // signalling channel events
    signalChannel = {
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
    peerconnection = new PeerConnection.provider(portApp,
                                        undefined,
                                        MockRTCPeerConnection,
                                        MockRTCSessionDescription,
                                        MockRTCIceCandidate);
    peerconnection.dispatchEvent = function(event, data) {
      if (dispatchedEvents[event] === undefined) {
        dispatchedEvents[event] = [];
      }
      dispatchedEvents[event].push(data);
    };

    function setupCalled() {
      expect(emitted).toContain({eventName: "ready", eventData: undefined});
      done();
    }

    peerconnection.setup(PROXY, "setup peer", turnServers, false,
                         setupCalled);
    // Modify the SimpleDataPeer's pc object to change the state to CONNECTED,
    // so that SimpleDataPeer.runWhenConnected callbacks will be run.
    peerconnection.peer.pc.signalingState = 'stable';
    peerconnection.peer.pc.listeners['signalingstatechange']();
  });

  it("Opens data channel", function(done) {
    var rtcpc = MockRTCPeerConnection.mostRecent;
    spyOn(rtcpc, "createDataChannel").and.callThrough();
    peerconnection.openDataChannel("openDC", openDataChannelContinuation);

    function openDataChannelContinuation() {
      var dataChannel;
      expect(rtcpc.createDataChannel).toHaveBeenCalledWith("openDC", {});
      dataChannel = RTCDataChannel.mostRecent;
      expect(dataChannel).toBeDefined();
      expect(dataChannel.label).toEqual("openDC");
      done();
    }
  });

  it("Fires onOpenDataChannel for peer created data channels.", function(done) {
    var rtcpc = MockRTCPeerConnection.mostRecent;
    var dataChannel = new RTCDataChannel("onOpenDC", {});
    dataChannel.readyState = "open";
    var event = {channel: dataChannel};
    
    rtcpc.listeners.datachannel(event);
    expect(dispatchedEvents.onOpenDataChannel[0]).toEqual({ channelId: "onOpenDC"});
    done();
  });

  it("Closes data channel", function(done) {
    var rtcpc = MockRTCPeerConnection.mostRecent;
    var dataChannel;
    peerconnection.openDataChannel("closeDC", openDataChannelContinuation);

    function openDataChannelContinuation() {
      dataChannel = RTCDataChannel.mostRecent;
      expect(dataChannel).toBeDefined();
      spyOn(dataChannel, "close").and.callThrough();
      peerconnection.closeDataChannel("closeDC", closeDataChannelContinuation);
    }
    function closeDataChannelContinuation() {
      expect(dataChannel.close).toHaveBeenCalled();
      done();
    }
  });

  it("Fires onClose when closed", function(done) {
    var rtcpc = MockRTCPeerConnection.mostRecent;
    var dataChannel;
    peerconnection.openDataChannel("oncloseDC", openDataChannelContinuation);
    function openDataChannelContinuation() {
      dataChannel = RTCDataChannel.mostRecent;
      expect(dataChannel.onclose).toEqual(jasmine.any(Function));
      dataChannel.onclose();
      
      expect(dispatchedEvents.onCloseDataChannel[0]).toBeDefined();
      done();
    }
  });

  it("Sends message", function(done) {
    var rtcpc = MockRTCPeerConnection.mostRecent;
    var dataChannel;
    var sendInfo = {channelLabel: "sendDC",
                   text: "Hello World"};
    peerconnection.openDataChannel("sendDC", openDataChannelContinuation);

    function openDataChannelContinuation() {
      dataChannel = RTCDataChannel.mostRecent;
      expect(dataChannel).toBeDefined();
      spyOn(dataChannel, "send");
      peerconnection.send(sendInfo, sendContinuation);
    }
    function sendContinuation() {
      expect(dataChannel.send).toHaveBeenCalledWith("Hello World");
      done();
    }
  });

  it("Receives messages", function(done) {
    var rtcpc = MockRTCPeerConnection.mostRecent;
    var dataChannel;

    peerconnection.openDataChannel("receiveDC", openDataChannelContinuation);
    function openDataChannelContinuation() {
      dataChannel = RTCDataChannel.mostRecent;
      expect(dataChannel.onmessage).toEqual(jasmine.any(Function));
      dataChannel.onmessage({data: "Hello World"});

      var message = dispatchedEvents.onReceived[0];
      expect(message).toBeDefined();
      expect(message.channelLabel).toEqual("receiveDC");
      expect(message.text).toEqual("Hello World");

      done();
    }
  });

  it("getBufferAmount", function(done) {
    peerconnection.openDataChannel("bufAmountDC", openDataChannelContinuation);
    function openDataChannelContinuation() {
      var dataChannel = RTCDataChannel.mostRecent;
      peerconnection.
        getBufferedAmount("bufAmountDC",
                           checkBufferedAmount.bind(undefined, 0));

      dataChannel.bufferedAmount = 1;
      peerconnection.
        getBufferedAmount("bufAmountDC",
                           checkBufferedAmount.bind(undefined, 1));

      dataChannel.bufferedAmount = 1337;
      peerconnection.
        getBufferedAmount("bufAmountDC",
                           checkBufferedAmount.bind(undefined, 1337));
      done();
    }
    function checkBufferedAmount(expected, valueReturned) {
      expect(valueReturned).toEqual(expected);
    }
  });

  it("Only fires onClose once", function(done) {
    expect(dispatchedEvents.onClose).not.toBeDefined();
    peerconnection.close(function() {
      expect(dispatchedEvents.onClose.length).toEqual(1);
    });
    peerconnection.close(function() {
      expect(dispatchedEvents.onClose.length).toEqual(1);
      done();
    });
  });

});
