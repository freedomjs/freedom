/**
 * DataPeer
 * Assumes that RTCPeerConnection is defined.
 */
 (function (exports) {
   "use strict";

//-----------------------------------------------------------------------------
// Console debugging utilities
//-----------------------------------------------------------------------------
// Abbreviation for console['type'] (type = log/warn/error) that inserts time at
// front.
function trace_to_console(type) {
  var argsArray = [];
  for (var i = 1; i < arguments.length; i++) {
    argsArray[i - 1] = arguments[i];
  }
  var text = argsArray[0];
  var s = (performance.now() / 1000).toFixed(3) + ": " + text;
  argsArray[0] = s;
  console[type].apply(console, argsArray);
}
var trace = {
  log: trace_to_console.bind(null, "log"),
  warn: trace_to_console.bind(null, "warn"),
  error: trace_to_console.bind(null, "error"),
};

//-----------------------------------------------------------------------------
// A class that wraps a peer connection and its data channels.
//-----------------------------------------------------------------------------
// TODO: check that Handling of pranswer is treated appropriately.
var SimpleDataPeerState = {
  DISCONNECTED: 'DISCONNECTED',
  CONNECTING: 'CONNECTING',
  CONNECTED: 'CONNECTED'
};

function SimpleDataPeer(peerName) {
  this.peerName = peerName;

  // depending on environment, select implementation.
  var RTCPeerConnection = RTCPeerConnection || webkitRTCPeerConnection || mozRTCPeerConnection;
  //TODO wire up STUN/TURN server config from options page
  var static_pc_config = [
    "stun:stun.l.google.com:19302",
    "stun:stun1.l.google.com:19302",
    "stun:stun2.l.google.com:19302",
    "stun:stun3.l.google.com:19302",
    "stun:stun4.l.google.com:19302" // ,
    // "turn:stun.l.google.com:19302"
  ];

  var constraints = {optional: [{DtlsSrtpKeyAgreement: true}]};
  // A way to speak to the peer to send SDP headers etc.
  this._sendSignalMessage = null;

  this._pc = null;  // The peer connection.
  // Get TURN servers for the peer connection.
  var iceServer;
  var pc_config = {iceServers: []};
  for (var i = 0; i < static_pc_config.length; i++) {
    iceServer = { 'url' : static_pc_config[i] };
    pc_config.iceServers.push(iceServer);
  }
  this._pc = new RTCPeerConnection(pc_config, constraints);
  // Add basic event handlers.
  this._pc.addEventListener("icecandidate",
                            this._onIceCallback.bind(this));
  this._pc.addEventListener("negotiationneeded",
                            this._onNegotiationNeeded.bind(this));
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
  if (this._pc === null) {
    console.error('SimpleDataPeer: Something is terribly wrong. PeerConnection is null');
    // we're still waiting.
  } else {
    func();
  }
};

SimpleDataPeer.prototype.addPCEventListener = function(event, func) {
  this._pc_listeners.push({event: event, func: func});
};

SimpleDataPeer.prototype._onSignalingStateChange = function () {
//  trace.log(this.peerName + ": " + "_onSignalingStateChange: ",
//      this._pc.signalingState);
  if (this._pc.signalingState == "stable") {
    this._pcState = SimpleDataPeerState.CONNECTED;
  }
};

SimpleDataPeer.prototype.setSendSignalMessage = function (sendSignalMessageFn) {
  this._sendSignalMessage = sendSignalMessageFn;
};

// Handle a message send on the signalling channel to this peer.
SimpleDataPeer.prototype.handleSignalMessage = function (messageText) {
//  trace.log(this.peerName + ": " + "handleSignalMessage: \n" +
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
            trace.error(this.peerName + ": " +
                "setRemoteDescription failed:", e);
          }.bind(this));
    } else if (json.candidate) {
      // Add remote ice candidate.
      console.log("Adding ice candidate: " + JSON.stringify(json.candidate));
      var ice_candidate = new RTCIceCandidate(json.candidate);
      this._pc.addIceCandidate(ice_candidate);
    } else {
      trace.warn(this.peerName + ": " +
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
          trace.error(this.peerName + ": " +
              "createOffer failed: ", e.toString());
          this._pcState = SimpleDataPeerState.DISCONNECTED;
        }.bind(this));
  }.bind(this));
};

// When we get our description, we set it to be our local description and
// send it to the peer.
SimpleDataPeer.prototype._onDescription = function (description) {
  this.runWhenReady(function() {
    if (this._sendSignalMessage) {
      this._pc.setLocalDescription(
          description, function() {
            this._sendSignalMessage(JSON.stringify({'sdp':description}));
          }.bind(this), function (e) { trace.error(this.peerName + ": " +
              "setLocalDescription failed:", e);
          }.bind(this));
    } else {
      trace.error(this.peerName + ": " +
          "_onDescription: _sendSignalMessage is not set, so we did not " +
              "set the local description. ");
    }
  }.bind(this));
};

SimpleDataPeer.prototype.close = function() {
  this._pc.close();
  // trace.log(this.peerName + ": " + "Closed peer connection.");
};

//
SimpleDataPeer.prototype._onNegotiationNeeded = function (e) {
  // trace.log(this.peerName + ": " + "_onNegotiationNeeded", this._pc, e);
  if(this._pcState != SimpleDataPeerState.DISCONNECTED) {
    // Negotiation messages are falsely requested for new data channels.
    //   https://code.google.com/p/webrtc/issues/detail?id=2431
    // This code is a hack to simply reset the same local and remote
    // description which will trigger the appropriate data channel open event.
    // TODO: fix/remove this when Chrome issue is fixed.
    var logSuccess = function (op) { return function() {
      //trace.log(this.peerName + ": " + op + " succeeded ");
    }.bind(this); }.bind(this);
    var logFail = function (op) { return function(e) {
      //trace.log(this.peerName + ": " + op + " failed: " + e);
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
    // trace.log(this.peerName + ": " + "ice callback with candidate", event);
    if (this._sendSignalMessage) {
      this._sendSignalMessage(JSON.stringify({'candidate': event.candidate}));
    } else {
      trace.warn(this.peerName + ": " + "_onDescription: _sendSignalMessage is not set.");
    }
  }
};

//-----------------------------------------------------------------------------
// Smart wrapper for a data channels, including real notion of open an queuing
//-----------------------------------------------------------------------------
// Stores state of a datachannel. The issue is that even when a data channel is
// in state open, unless the other end is also open, sent messages may not be
// receieved. To ensure that sent messages are recieved, we send an initial ping
// - pong message and consider the chanel truly open once we get or send a pong
// message.
//
// TODO: remove PingPong; it's complex and shouldn't be needed. Also note that
// combined with the bad channel name sending bug, this will have problems if
// the channel name is PING or PONG. Note: using \b (backspace) to make it
// unlikely that a channel name will clash.
var PingPongMessage =  {
  PING: '\bping',
  PONG : '\bpong'
};

var SmartDataChannelState =  {
  PENDING : 'pending', // waiting for channel to open.
  PINGED : 'pinged',  // I got a ping (and sent a pong)
  PONGED : 'ponged',  // I never got a ping message, but I got a pong.
  CONNECTED: 'connected',  // Have got both a ping and a pong from the peer.
  CLOSED : 'closed' // channel was closed.
};

function SmartDataChannel(channel, peerName, callbacks) {
  this.peerName = peerName;
  this.dataChannel = channel;
  this.state = SmartDataChannelState.PENDING;
  // queue of messages to send when the channel is ready.
  this.queue = [];

  // These are the DataPeer-level callbacks. They provide some abstraction over
  // underlying datachannels and peer connection. e.g. onOpen is called at the
  // point when sending messages will actualy work.
  this._callbacks = {
    // onOpenFn is called at the point messages will actually get through.
    onOpenFn: function (smartDataChannel) {
/*      trace.log(smartDataChannel.peerName + ": dataChannel(" +
        smartDataChannel.dataChannel.label +
        "): onOpenFn"); */
    },
    onCloseFn: function (smartDataChannel) {
/*      trace.log(smartDataChannel.peerName + ": dataChannel(" +
        smartDataChannel.dataChannel.label +
        "): onCloseFn"); */
    },
    // Default on real message prints it to console.
    onMessageFn: function (smartDataChannel, event) {
/*      trace.log(smartDataChannel.peerName + ": dataChannel(" +
          smartDataChannel.dataChannel.label +
          "): onMessageFn", event); */
    },
    // Default on error, prints it.
    onErrorFn: function(smartDataChannel, err) {
      trace.error(smartDataChannel.peerName + ": dataChannel(" +
          smartDataChannel.dataChannel.label + "): error: ", err);
    }
  };
  for(var cb_key in callbacks) {
    // Let the programmer know that a bad (unusable) callback key exists.
    if(!(cb_key in this._callbacks)) {
      trace.log(this.peerName + ": Bad callback specified: " + cb_key +
          ". Being ignored.");
    } else { this._callbacks[cb_key] = callbacks[cb_key]; }
  }

  // This is a local binding for the ping-pong protocol handling of messages so
  // that it can be removed from the event listeners later.
  this._onPingPongMessageFn = this._onPingPongMessage.bind(this);

  // The handlers for the underlying data channel events. _startPingPong will
  // set the 'message' handler.
  channel.addEventListener("open", this._startPingPong.bind(this));
  channel.addEventListener("close", this._onClose.bind(this));
  channel.addEventListener("error", this._onError.bind(this));
}

SmartDataChannel.prototype._startPingPong = function () {
  this.dataChannel.addEventListener("message", this._onPingPongMessageFn);
/*  trace.log(this.peerName + ": dataChannel(" + this.dataChannel.label +
      "): Sending PING"); */
  this.dataChannel.send(PingPongMessage.PING);
};

// This logic is complex. :(  TODO: this should not be needed; when a data
// channel is open, this should guarentee that the message will get to the other
// side. See issue: https://code.google.com/p/webrtc/issues/detail?id=2406&thanks=2406&ts=1379699312
SmartDataChannel.prototype._onPingPongMessage = function (event) {
/*  trace.log(this.peerName + ": dataChannel(" + this.dataChannel.label +
      "): Message during PingPong startup: ", event); */
  if (event.data == PingPongMessage.PING) {
    if (this.state == SmartDataChannelState.PONGED) {
      this._onConnected();
    } else if (this.state == SmartDataChannelState.PENDING) {
      this.dataChannel.send(PingPongMessage.PONG);
      this.state = SmartDataChannelState.PINGED;
    } else {
      trace.log(this.peerName + ": dataChannel(" +
          this.dataChannel.label +
          "): unkown state for message: " + this.state);
    }
  } else if (event.data == PingPongMessage.PONG) {
    if (this.state == SmartDataChannelState.PINGED) {
      this._onConnected();
    } else if (this.state == SmartDataChannelState.PENDING) {
      this.dataChannel.send(PingPongMessage.PONG);
      this._onConnected();
    } else {
      trace.error(this.peerName + ": dataChannel(" +
          this.dataChannel.label +
          "): unkown state for message: " + this.state);
    }
  } else {
    // Sometimes we get messages with a channel id when a channel starts up. I
    // think this is a bug:
    //   https://code.google.com/p/webrtc/issues/detail?id=2439
    // TODO: When that bug is fixed, add a warning here.
  }
};

SmartDataChannel.prototype._onError = function (e) {
  this._callbacks(this,e);
};

SmartDataChannel.prototype._onConnected = function () {
  /*trace.log(this.peerName + ": dataChannel(" + this.dataChannel.label +
      "): CONNECTED", event); */
  this.state = SmartDataChannelState.CONNECTED;
  this.dataChannel.removeEventListener("message", this._onPingPongMessageFn);
  this.dataChannel.addEventListener("message", this._onMessage.bind(this));
  this._callbacks.onOpenFn(this);
  this._sendQueuedMessages();
};

SmartDataChannel.prototype._sendQueuedMessages = function () {
  while(this.queue.length > 0) { this.dataChannel.send(this.queue.shift()); }
};

SmartDataChannel.prototype._onMessage = function (event) {
  this._callbacks.onMessageFn(this, event);
};

SmartDataChannel.prototype._onClose = function () {
  this.close();
};

// Given an ArrayBuffer, a string, or a Blob, send it on the underlying data
// channel. If not connected, queues the message and sends it when connected.
SmartDataChannel.prototype.send = function (message) {
  if (this.state == SmartDataChannelState.CONNECTED) {
    this.dataChannel.send(message);
  } else {
    this.queue.push(message);
  }
};

SmartDataChannel.prototype.close = function () {
  if(this.dataChannel.readyState != "closed") {
    this.dataChannel.close();
  }
  this.state = SmartDataChannelState.CLOSED;
  this._callbacks.onCloseFn(this);
};

//-----------------------------------------------------------------------------
// A nicer wrapper for P2P data channels that uses SmartDataChannel and
// datachannel labels to provide a simpler interface that abstracts over all
// the channel negotiation stuff.
//-----------------------------------------------------------------------------
// A smart wrapper for data channels that queues messages.
// this._dataChannelCallbacks : {
//   onOpenFn: function (smartDataChannel) {...},
//   onCloseFn: function (smartDataChannel) {...},
//   onMessageFn: function (smartDataChannel, event) {...},
//   onErrorFn: function (smartDataChannel, error) {...},
// };
function DataPeer(peerName, dataChannelCallbacks) {
  this.peerName = peerName;
  this._simplePeer = new SimpleDataPeer(this.peerName);
  // All channels created and in this peer connection.
  this._smartChannels = {};
  // These are the DataPeer-level callbacks. They provide some abstraction over
  // underlying datachannels and peer connection. e.g. onOpen is called at the
  // point when sending messages will actualy work.
  this._dataChannelCallbacks = dataChannelCallbacks;
  this._simplePeer.runWhenReady(function() {
    this._pc = this._simplePeer._pc;
    this._pc.addEventListener("datachannel", this._onDataChannel.bind(this));
  }.bind(this));
}

DataPeer.prototype.setSendSignalMessage = function (sendSignalMessageFn) {
  this._simplePeer.setSendSignalMessage(sendSignalMessageFn);
};

// Called when a peer has opened up a data channel to us.
DataPeer.prototype._onDataChannel = function (event) {
  this._smartChannels[event.channel.label] =
      new SmartDataChannel(event.channel, this.peerName,
          this._dataChannelCallbacks);
};

// Called to establish a new data channel with our peer.
DataPeer.prototype.openDataChannel = function (channelId, continuation) {
  this._simplePeer.runWhenReady(function() {
    this._smartChannels[channelId] =
        new SmartDataChannel(this._pc.createDataChannel(channelId, {}),
                             this.peerName, this._dataChannelCallbacks);
    continuation();
  }.bind(this));
};

// If channel doesn't already exist, start a new channel.
DataPeer.prototype.send = function (channelId, message, continuation) {
  if(!(channelId in this._smartChannels)) {
    this.openDataChannel(channelId, function() {
      this.send(channelId, message, continuation); }.bind(this));
  } else {
    this._smartChannels[channelId].send(message);
    continuation();
  }
};

DataPeer.prototype.closeChannel = function (channelId) {
  if(!(channelId in this._smartChannels)) {
//    trace.warn(this.peerName + ": " + "Trying to close a data channel id (" + channelId + ") that does not exist.");
    return;
  }
  this._smartChannels[channelId].close();
  delete this._smartChannels[channelId];
};

DataPeer.prototype.close = function () {
  for(var channelId in this._smartChannels) {
    this.closeChannel(channelId);
  }
//  trace.log(this.peerName + ": " + "Closed DataPeer.");
  this._pc.close();
};

DataPeer.prototype.handleSignalMessage = function (message) {
  this._simplePeer.handleSignalMessage(message);
};

// Export to the environment
exports.DataPeer = DataPeer;
}(window));
