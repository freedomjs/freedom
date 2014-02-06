// A FreeDOM interface to a WebRTC Peer Connection via the peerdata wrapper.

/**
 * DataPeer
 * Assumes that RTCPeerConnection is defined.
 */


//-----------------------------------------------------------------------------
// A class that wraps a peer connection and its data channels.
//-----------------------------------------------------------------------------
// TODO: check that Handling of pranswer is treated appropriately.
var SimpleDataPeerState = {
  DISCONNECTED: 'DISCONNECTED',
  CONNECTING: 'CONNECTING',
  CONNECTED: 'CONNECTED'
};

function SimpleDataPeer(peerName, stunServers, dataChannelCallbacks) {
  this.peerName = peerName;
  this._channels = {};
  this._dataChannelCallbacks = dataChannelCallbacks;

  // depending on environment, select implementation.
  var RTCPC = RTCPeerConnection || webkitRTCPeerConnection || mozRTCPeerConnection;

  var constraints = {optional: [{DtlsSrtpKeyAgreement: true}]};
  // A way to speak to the peer to send SDP headers etc.
  this._sendSignalMessage = null;

  this._pc = null;  // The peer connection.
  // Get TURN servers for the peer connection.
  var iceServer;
  var pc_config = {iceServers: []};
  for (var i = 0; i < stunServers.length; i++) {
    iceServer = { 'url' : stunServers[i] };
    pc_config.iceServers.push(iceServer);
  }
  this._pc = new RTCPC(pc_config, constraints);
  // Add basic event handlers.
  this._pc.addEventListener("icecandidate",
                            this._onIceCallback.bind(this));
  this._pc.addEventListener("negotiationneeded",
                            this._onNegotiationNeeded.bind(this));
  this._pc.addEventListener("datachannel",
                            this._onDataChannel.bind(this));
  this._pc.addEventListener("signalingstatechange", function () {
    if (this._pc.signalingState == "stable") {
      this._pcState = SimpleDataPeerState.CONNECTED;
    }
  }.bind(this));
  // This state variable is used to fake offer/answer when they are wrongly
  // requested and we really just need to reuse what we already have.
  this._pcState = SimpleDataPeerState.DISCONNECTED;

  // Note: to actually do something with data channels opened by a peer, we
  // need someone to manage "datachannel" event.
}

// Queue 'func', a 0-arg closure, for invocation when the TURN server
// gets back to us, and we have a valid RTCPeerConnection in this._pc.
// If we already have it, run func immediately.
SimpleDataPeer.prototype.runWhenReady = function(func) {
  if (typeof this._pc === "undefined" || this._pc === null) {
    console.error('SimpleDataPeer: Something is terribly wrong. PeerConnection is null');
    // we're still waiting.
  } else {
    func();
  }
};

SimpleDataPeer.prototype.send = function(channelId, message, continuation) {
  this._channels[channelId].send(message);
  continuation();
};

SimpleDataPeer.prototype.addPCEventListener = function(event, func) {
  this._pc_listeners.push({event: event, func: func});
};

SimpleDataPeer.prototype.openDataChannel = function(channelId, continuation) {
  this.runWhenReady(function doOpenDataChannel() {
    var dataChannel = this._pc.createDataChannel(channelId, {});
    dataChannel.onopen = function() {
      this._addDataChannel(channelId, dataChannel);
      continuation();
      this._dataChannelCallbacks.onOpenFn(dataChannel, {label: channelId});
    }.bind(this);
  }.bind(this));
};

SimpleDataPeer.prototype.closeChannel= function(channelId) {
  if(channelId in this._channels) {
    this._channels[channelId].close();
    delete this._channels[channelId];
  }
};

SimpleDataPeer.prototype.setSendSignalMessage = function (sendSignalMessageFn) {
  this._sendSignalMessage = sendSignalMessageFn;
};

// Handle a message send on the signalling channel to this peer.
SimpleDataPeer.prototype.handleSignalMessage = function (messageText) {
//  console.log(this.peerName + ": " + "handleSignalMessage: \n" +
//      messageText);
  var json = JSON.parse(messageText);
  this.runWhenReady(function() {
    // TODO: If we are offering and they are also offerring at the same time,
    // pick the one who has the lower randomId?
    // (this._pc.signalingState == "have-local-offer" && json.sdp &&
    //    json.sdp.type == "offer" && json.sdp.randomId < this.localRandomId)
    if (json.sdp) {
      // Set the remote description.
      this._pc.setRemoteDescription(
         new RTCSessionDescription(json.sdp),
          // Success
          function () {
            if (this._pc.remoteDescription.type == "offer") {
              this._pc.createAnswer(this._onDescription.bind(this));
            }
          }.bind(this),
          // Failure
          function (e) {
            console.error(this.peerName + ": " +
                "setRemoteDescription failed:", e);
          }.bind(this));
    } else if (json.candidate) {
      // Add remote ice candidate.
      console.log(this.peerName + ": Adding ice candidate: " + JSON.stringify(json.candidate));
      var ice_candidate = new RTCIceCandidate(json.candidate);
      this._pc.addIceCandidate(ice_candidate);
    } else {
      console.warn(this.peerName + ": " +
          "handleSignalMessage got unexpected message: ", messageText);
    }
  }.bind(this));
};

// Connect to the peer by the signalling channel.
SimpleDataPeer.prototype.negotiateConnection = function () {
  this._pcState = SimpleDataPeerState.CONNECTING;
  this.runWhenReady(function() {
    this._pc.createOffer(
        this._onDescription.bind(this),
        function(e) {
          console.error(this.peerName + ": " +
              "createOffer failed: ", e.toString());
          this._pcState = SimpleDataPeerState.DISCONNECTED;
        }.bind(this));
  }.bind(this));
};

SimpleDataPeer.prototype.close = function() {
  if(this._pc.signalingState !== "closed") {
    this._pc.close();
  }
  // console.log(this.peerName + ": " + "Closed peer connection.");
};

SimpleDataPeer.prototype._addDataChannel = function(channelId, channel) {
  var callbacks = this._dataChannelCallbacks;
  this._channels[channelId] = channel;

  // channel.onopen = callbacks.onOpenFn.bind(this, channel, {label: channelId});

  channel.onclose = callbacks.onCloseFn.bind(this, channel, {label: channelId});

  channel.onmessage = callbacks.onMessageFn.bind(this, channel,
                                                 {label: channelId});

  channel.onerror = callbacks.onErrorFn.bind(this, channel, {label: channel});
};

// When we get our description, we set it to be our local description and
// send it to the peer.
SimpleDataPeer.prototype._onDescription = function (description) {
  this.runWhenReady(function() {
    if (this._sendSignalMessage) {
      this._pc.setLocalDescription(
          description, function() {
            this._sendSignalMessage(JSON.stringify({'sdp':description}));
          }.bind(this), function (e) { console.error(this.peerName + ": " +
              "setLocalDescription failed:", e);
          }.bind(this));
    } else {
      console.error(this.peerName + ": " +
          "_onDescription: _sendSignalMessage is not set, so we did not " +
              "set the local description. ");
    }
  }.bind(this));
};

//
SimpleDataPeer.prototype._onNegotiationNeeded = function (e) {
  // console.log(this.peerName + ": " + "_onNegotiationNeeded", this._pc, e);
  if(this._pcState != SimpleDataPeerState.DISCONNECTED) {
    // Negotiation messages are falsely requested for new data channels.
    //   https://code.google.com/p/webrtc/issues/detail?id=2431
    // This code is a hack to simply reset the same local and remote
    // description which will trigger the appropriate data channel open event.
    // TODO: fix/remove this when Chrome issue is fixed.
    var logSuccess = function (op) { return function() {
      //console.log(this.peerName + ": " + op + " succeeded ");
    }.bind(this); }.bind(this);
    var logFail = function (op) { return function(e) {
      //console.log(this.peerName + ": " + op + " failed: " + e);
    }.bind(this); }.bind(this);
    if (this._pc.localDescription && this._pc.remoteDescription &&
        this._pc.localDescription.type == "offer") {
      this._pc.setLocalDescription(this._pc.localDescription,
                                   logSuccess("setLocalDescription"),
                                   logFail("setLocalDescription"));
      this._pc.setRemoteDescription(this._pc.remoteDescription,
                                    logSuccess("setRemoteDescription"),
                                    logFail("setRemoteDescription"));
    } else if (this._pc.localDescription && this._pc.remoteDescription &&
        this._pc.localDescription.type == "answer") {
      this._pc.setRemoteDescription(this._pc.remoteDescription,
                                    logSuccess("setRemoteDescription"),
                                    logFail("setRemoteDescription"));
      this._pc.setLocalDescription(this._pc.localDescription,
                                   logSuccess("setLocalDescription"),
                                   logFail("setLocalDescription"));
    }
    return;
  }
  this.negotiateConnection();
};

SimpleDataPeer.prototype._onIceCallback = function (event) {
  if (event.candidate) {
    // Send IceCandidate to peer.
    // console.log(this.peerName + ": " + "ice callback with candidate", event);
    if (this._sendSignalMessage) {
      this._sendSignalMessage(JSON.stringify({'candidate': event.candidate}));
    } else {
      console.warn(this.peerName + ": " + "_onDescription: _sendSignalMessage is not set.");
    }
  }
};

SimpleDataPeer.prototype._onSignalingStateChange = function () {
//  console.log(this.peerName + ": " + "_onSignalingStateChange: ",
//      this._pc.signalingState);
  if (this._pc.signalingState == "stable") {
    this._pcState = SimpleDataPeerState.CONNECTED;
  }
};

SimpleDataPeer.prototype._onDataChannel = function(event) {
  this._addDataChannel(event.channel.label, event.channel);
};

// _signallingChannel is a channel for emitting events back to the freedom Hub.
function PeerConnection(portApp) {

    // a (hopefully unique) ID for debugging.
  this.peerName = "p" + Math.random();

  // This is the portApp (defined in freedom/src/port-app.js). A way to speak
  // to freedom.
  this._portApp = portApp;

  // This is the a channel to send signalling messages.
  this._signallingChannel = null;

  // The DataPeer object for talking to the peer.
  this._peer = null; 

  // The Core object for managing channels.
  this._portApp.once('core', function(Core) {
    this._core = new Core();
  }.bind(this));
  this._portApp.emit(this._portApp.controlChannel, {
    type: 'core request delegated to peerconnection',
    request: 'core'
  });
}

// Start a peer connection using the given freedomChannelId as the way to
// communicate with the peer. The argument |freedomChannelId| is a way to speak
// to an identity provide to send them SDP headers negotiate the address/port to
// setup the peer to peerConnection.
//
// options: {
//   peerName: string,   // For pretty printing messages about this peer.
//   debug: boolean           // should we add extra
// }
PeerConnection.prototype.setup =
    function(signallingChannelId, peerName, stunServers, continuation) {
  this.peerName = peerName;
  var self = this;

  var dataChannelCallbacks = {
    // onOpenFn is called at the point messages will actually get through.
    onOpenFn: function (dataChannel, info) {
      self.dispatchEvent("onOpenDataChannel",
                         info.label);
    },
    onCloseFn: function (dataChannel, info) {
      self.dispatchEvent("onCloseDataChannel",
                         { channelId: info.label});
    },
    // Default on real message prints it to console.
    onMessageFn: function (dataChannel, info, event) {
      if (event.data instanceof ArrayBuffer) {
        self.dispatchEvent('onReceived',
            { 'channelLabel': info.label,
              'buffer': event.data });
      } else if (typeof(event.data) == 'string') {
        self.dispatchEvent('onReceived',
            { 'channelLabel': info.label,
              'text': event.data });
      }
    },
    // Default on error, prints it.
    onErrorFn: function(dataChannel, info, err) {
      console.error(smartDataChannel.peerName + ": dataChannel(" +
          smartDataChannel.dataChannel.label + "): error: ", err);
    }
  };

  this._peer = new SimpleDataPeer(this.peerName, stunServers,
                                  dataChannelCallbacks);

  // Setup link between Freedom messaging and _peer's signalling.
  // Note: the signalling channel should only be sending receiveing strings.
  this._core.bindChannel(signallingChannelId, function(channel) {
    this._signallingChannel = channel;
    this._peer.setSendSignalMessage((function(msg) {
      this._signallingChannel.emit('message', msg);
    }).bind(this));
    this._signallingChannel.on('message',
        this._peer.handleSignalMessage.bind(this._peer));
    this._signallingChannel.emit('ready');
    continuation();
  }.bind(this));

};

// TODO: delay continuation until the open callback from _peer is called.
PeerConnection.prototype.openDataChannel =
    function(channelId, continuation) {
  this._peer.openDataChannel(channelId, continuation);
};

PeerConnection.prototype.closeDataChannel =
    function(channelId, continuation) {
  this._peer.closeChannel(channelId);
  continuation();
};

// Called to send a message over the given datachannel to a peer. If the data
// channel doesn't already exist, the DataPeer creates it.
PeerConnection.prototype.send = function(sendInfo, continuation) {
  var objToSend = sendInfo.text || sendInfo.buffer || sendInfo.binary;
  if (typeof objToSend === 'undefined') {
    console.error("No valid data to send has been provided.", sendInfo);
    return;
  }
  //DEBUG
  objToSend = new ArrayBuffer(4);
  //DEBUG
  this._peer.send(sendInfo.channelLabel, objToSend, continuation);
};

PeerConnection.prototype.close = function(continuation) {
  this._peer.close();
  continuation();
  this.dispatchEvent("onClose");
};

fdom.apis.register('core.peerconnection', PeerConnection);
