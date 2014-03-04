/*globals fdom:true, console, RTCPeerConnection, webkitRTCPeerConnection */
/*globals mozRTCPeerConnection, RTCSessionDescription, RTCIceCandidate */
/*globals ArrayBuffer */
/*jslint indent:2,sloppy:true */
/**
 * DataPeer - a class that wraps peer connections and data channels.
 */
// TODO: check that Handling of pranswer is treated appropriately.
var SimpleDataPeerState = {
  DISCONNECTED: 'DISCONNECTED',
  CONNECTING: 'CONNECTING',
  CONNECTED: 'CONNECTED'
};

function SimpleDataPeer(peerName, stunServers, dataChannelCallbacks) {
  var RTCPC,
    constraints,
    config,
    i;
  this.peerName = peerName;
  this.channels = {};
  this.dataChannelCallbacks = dataChannelCallbacks;

  if (typeof RTCPeerConnection !== "undefined") {
    RTCPC = RTCPeerConnection;
  } else if (typeof webkitRTCPeerConnection !== "undefined") {
    RTCPC = webkitRTCPeerConnection;
  } else if (typeof mozRTCPeerConnection !== "undefined") {
    RTCPC = mozRTCPeerConnection;
  } else {
    throw new Error("This environment does not seem to support RTCPeerConnection");
  }

  constraints = {
    optional: [{DtlsSrtpKeyAgreement: true}]
  };
  // A way to speak to the peer to send SDP headers etc.
  this.sendSignalMessage = null;

  this.pc = null;  // The peer connection.
  // Get TURN servers for the peer connection.
  config = {iceServers: []};
  for (i = 0; i < stunServers.length; i += 1) {
    config.iceServers.push({
      'url' : stunServers[i]
    });
  }
  this.pc = new RTCPC(config, constraints);
  // Add basic event handlers.
  this.pc.addEventListener("icecandidate",
                            this.onIceCallback.bind(this));
  this.pc.addEventListener("negotiationneeded",
                            this.onNegotiationNeeded.bind(this));
  this.pc.addEventListener("datachannel",
                            this.onDataChannel.bind(this));
  this.pc.addEventListener("signalingstatechange", function () {
    if (this.pc.signalingState === "stable") {
      this.pcState = SimpleDataPeerState.CONNECTED;
    }
  }.bind(this));
  // This state variable is used to fake offer/answer when they are wrongly
  // requested and we really just need to reuse what we already have.
  this.pcState = SimpleDataPeerState.DISCONNECTED;

  // Note: to actually do something with data channels opened by a peer, we
  // need someone to manage "datachannel" event.
}

// Queue 'func', a 0-arg closure, for invocation when the TURN server
// gets back to us, and we have a valid RTCPeerConnection in this.pc.
// If we already have it, run func immediately.
SimpleDataPeer.prototype.runWhenReady = function (func) {
  if (typeof this.pc === "undefined" || this.pc === null) {
    console.error('SimpleDataPeer: Something is terribly wrong. PeerConnection is null');
    // we're still waiting.
  } else {
    func();
  }
};

SimpleDataPeer.prototype.send = function (channelId, message, continuation) {
  this.channels[channelId].send(message);
  continuation();
};

SimpleDataPeer.prototype.openDataChannel = function (channelId, continuation) {
  this.runWhenReady(function doOpenDataChannel() {
    var dataChannel = this.pc.createDataChannel(channelId, {});
    dataChannel.onopen = function () {
      this.addDataChannel(channelId, dataChannel);
      continuation();
    }.bind(this);
  }.bind(this));
};

SimpleDataPeer.prototype.closeChannel = function (channelId) {
  if (this.channels[channelId] !== undefined) {
    this.channels[channelId].close();
    delete this.channels[channelId];
  }
};

SimpleDataPeer.prototype.getBufferedAmount = function (channelId,
                                                       continuation) {
  if (this.channels[channelId] !== undefined) {
    var dataChannel = this.channels[channelId];
    return dataChannel.bufferedAmount;
  }
  throw new Error("No channel with id: " + channelId);
};

SimpleDataPeer.prototype.setSendSignalMessage = function (sendSignalMessageFn) {
  this.sendSignalMessage = sendSignalMessageFn;
};

// Handle a message send on the signalling channel to this peer.
SimpleDataPeer.prototype.handleSignalMessage = function (messageText) {
//  console.log(this.peerName + ": " + "handleSignalMessage: \n" +
//      messageText);
  var json = JSON.parse(messageText);
  this.runWhenReady(function () {
    // TODO: If we are offering and they are also offerring at the same time,
    // pick the one who has the lower randomId?
    // (this.pc.signalingState == "have-local-offer" && json.sdp &&
    //    json.sdp.type == "offer" && json.sdp.randomId < this.localRandomId)
    if (json.sdp) {
      // Set the remote description.
      this.pc.setRemoteDescription(
        new RTCSessionDescription(json.sdp),
        // Success
        function () {
          if (this.pc.remoteDescription.type === "offer") {
            this.pc.createAnswer(this.onDescription.bind(this));
          }
        }.bind(this),
        // Failure
        function (e) {
          console.error(this.peerName + ": " +
              "setRemoteDescription failed:", e);
        }.bind(this)
      );
    } else if (json.candidate) {
      // Add remote ice candidate.
      console.log(this.peerName + ": Adding ice candidate: " + JSON.stringify(json.candidate));
      var ice_candidate = new RTCIceCandidate(json.candidate);
      this.pc.addIceCandidate(ice_candidate);
    } else {
      console.warn(this.peerName + ": " +
          "handleSignalMessage got unexpected message: ", messageText);
    }
  }.bind(this));
};

// Connect to the peer by the signalling channel.
SimpleDataPeer.prototype.negotiateConnection = function () {
  this.pcState = SimpleDataPeerState.CONNECTING;
  this.runWhenReady(function () {
    this.pc.createOffer(
      this.onDescription.bind(this),
      function (e) {
        console.error(this.peerName + ": " +
            "createOffer failed: ", e.toString());
        this.pcState = SimpleDataPeerState.DISCONNECTED;
      }.bind(this)
    );
  }.bind(this));
};

SimpleDataPeer.prototype.close = function () {
  if (this.pc.signalingState !== "closed") {
    this.pc.close();
  }
  // console.log(this.peerName + ": " + "Closed peer connection.");
};

SimpleDataPeer.prototype.addDataChannel = function (channelId, channel) {
  var callbacks = this.dataChannelCallbacks;
  this.channels[channelId] = channel;

  if (channel.readyState === "connecting") {
    channel.onopen = callbacks.onOpenFn.bind(this, channel, {label: channelId});
  }

  channel.onclose = callbacks.onCloseFn.bind(this, channel, {label: channelId});

  channel.onmessage = callbacks.onMessageFn.bind(this, channel,
                                                 {label: channelId});

  channel.onerror = callbacks.onErrorFn.bind(this, channel, {label: channel});
};

// When we get our description, we set it to be our local description and
// send it to the peer.
SimpleDataPeer.prototype.onDescription = function (description) {
  this.runWhenReady(function () {
    if (this.sendSignalMessage) {
      this.pc.setLocalDescription(
        description,
        function () {
          this.sendSignalMessage(JSON.stringify({'sdp': description}));
        }.bind(this),
        function (e) {
          console.error(this.peerName + ": " +
              "setLocalDescription failed:", e);
        }.bind(this)
      );
    } else {
      console.error(this.peerName + ": " +
          "_onDescription: _sendSignalMessage is not set, so we did not " +
              "set the local description. ");
    }
  }.bind(this));
};

SimpleDataPeer.prototype.onNegotiationNeeded = function (e) {
  // console.log(this.peerName + ": " + "_onNegotiationNeeded", this._pc, e);
  if (this.pcState !== SimpleDataPeerState.DISCONNECTED) {
    // Negotiation messages are falsely requested for new data channels.
    //   https://code.google.com/p/webrtc/issues/detail?id=2431
    // This code is a hack to simply reset the same local and remote
    // description which will trigger the appropriate data channel open event.
    // TODO: fix/remove this when Chrome issue is fixed.
    var logSuccess = function (op) {
      return function () {
        //console.log(this.peerName + ": " + op + " succeeded ");
      }.bind(this);
    }.bind(this),
      logFail = function (op) {
        return function (e) {
          //console.log(this.peerName + ": " + op + " failed: " + e);
        }.bind(this);
      }.bind(this);
    if (this.pc.localDescription && this.pc.remoteDescription &&
        this.pc.localDescription.type === "offer") {
      this.pc.setLocalDescription(this.pc.localDescription,
                                   logSuccess("setLocalDescription"),
                                   logFail("setLocalDescription"));
      this.pc.setRemoteDescription(this.pc.remoteDescription,
                                    logSuccess("setRemoteDescription"),
                                    logFail("setRemoteDescription"));
    } else if (this.pc.localDescription && this.pc.remoteDescription &&
        this.pc.localDescription.type === "answer") {
      this.pc.setRemoteDescription(this.pc.remoteDescription,
                                    logSuccess("setRemoteDescription"),
                                    logFail("setRemoteDescription"));
      this.pc.setLocalDescription(this.pc.localDescription,
                                   logSuccess("setLocalDescription"),
                                   logFail("setLocalDescription"));
    }
    return;
  }
  this.negotiateConnection();
};

SimpleDataPeer.prototype.onIceCallback = function (event) {
  if (event.candidate) {
    // Send IceCandidate to peer.
    // console.log(this.peerName + ": " + "ice callback with candidate", event);
    if (this.sendSignalMessage) {
      this.sendSignalMessage(JSON.stringify({'candidate': event.candidate}));
    } else {
      console.warn(this.peerName + ": " + "_onDescription: _sendSignalMessage is not set.");
    }
  }
};

SimpleDataPeer.prototype.onSignalingStateChange = function () {
//  console.log(this.peerName + ": " + "_onSignalingStateChange: ",
//      this._pc.signalingState);
  if (this.pc.signalingState === "stable") {
    this.pcState = SimpleDataPeerState.CONNECTED;
  }
};

SimpleDataPeer.prototype.onDataChannel = function (event) {
  this.addDataChannel(event.channel.label, event.channel);
  // RTCDataChannels created by a RTCDataChannelEvent have an initial
  // state of open, so the onopen event for the channel will not
  // fire. We need to fire the onOpenDataChannel event here
  // http://www.w3.org/TR/webrtc/#idl-def-RTCDataChannelState
  this.dataChannelCallbacks.onOpenFn(event.channel,
                                      {label: event.channel.label});
};

// _signallingChannel is a channel for emitting events back to the freedom Hub.
function PeerConnection(portModule, dispatchEvent) {
  // Channel for emitting events to consumer.
  this.dispatchEvent = dispatchEvent;

  // a (hopefully unique) ID for debugging.
  this.peerName = "p" + Math.random();

  // This is the portApp (defined in freedom/src/port-app.js). A way to speak
  // to freedom.
  this.freedomModule = portModule;

  // This is the a channel to send signalling messages.
  this.signallingChannel = null;

  // The DataPeer object for talking to the peer.
  this.peer = null;

  // The Core object for managing channels.
  this.freedomModule.once('core', function (Core) {
    this.core = new Core();
  }.bind(this));
  this.freedomModule.emit(this.freedomModule.controlChannel, {
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
PeerConnection.prototype.setup = function (signallingChannelId, peerName,
                                            stunServers, continuation) {
  this.peerName = peerName;
  var self = this,
    dataChannelCallbacks = {
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
          self.dispatchEvent('onReceived', {
            'channelLabel': info.label,
            'buffer': event.data
          });
        } else if (typeof (event.data) === 'string') {
          self.dispatchEvent('onReceived', {
            'channelLabel': info.label,
            'text': event.data
          });
        }
      },
      // Default on error, prints it.
      onErrorFn: function (dataChannel, info, err) {
        console.error(dataChannel.peerName + ": dataChannel(" +
                      dataChannel.dataChannel.label + "): error: ", err);
      }
    };

  this.peer = new SimpleDataPeer(this.peerName, stunServers,
                                  dataChannelCallbacks);

  // Setup link between Freedom messaging and _peer's signalling.
  // Note: the signalling channel should only be sending receiveing strings.
  this.core.bindChannel(signallingChannelId, function (channel) {
    this.signallingChannel = channel;
    this.peer.setSendSignalMessage(function (msg) {
      this.signallingChannel.emit('message', msg);
    }.bind(this));
    this.signallingChannel.on('message',
        this.peer.handleSignalMessage.bind(this.peer));
    this.signallingChannel.emit('ready');
    continuation();
  }.bind(this));

};

// TODO: delay continuation until the open callback from _peer is called.
PeerConnection.prototype.openDataChannel = function (channelId, continuation) {
  this.peer.openDataChannel(channelId, continuation);
};

PeerConnection.prototype.closeDataChannel = function (channelId, continuation) {
  this.peer.closeChannel(channelId);
  continuation();
};

// Called to send a message over the given datachannel to a peer. If the data
// channel doesn't already exist, the DataPeer creates it.
PeerConnection.prototype.send = function (sendInfo, continuation) {
  var objToSend = sendInfo.text || sendInfo.buffer || sendInfo.binary;
  if (typeof objToSend === 'undefined') {
    console.error("No valid data to send has been provided.", sendInfo);
    return;
  }
  //DEBUG
  // objToSend = new ArrayBuffer(4);
  //DEBUG
  this.peer.send(sendInfo.channelLabel, objToSend, continuation);
};

PeerConnection.prototype.getBufferedAmount = function (channelId, continuation) {
  continuation(this.peer.getBufferedAmount(channelId));
};

PeerConnection.prototype.close = function (continuation) {
  this.peer.close();
  continuation();
  this.dispatchEvent("onClose");
};

fdom.apis.register('core.peerconnection', PeerConnection);
