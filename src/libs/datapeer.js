/**
 * DataPeer
 */

'strict'


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

function SimpleDataPeer(options) {
  if (options) {
    this._debugPeerName = options.debugPeerName;
    this._debug = options.debug;
  }
  // A way to speak to the peer to send SDP headers etc.
  this._sendSignalMessage = null;
  // The peer connection.
  this.pc = new RTCPeerConnection(null,
      {optional: [{DtlsSrtpKeyAgreement: true}]});

  // This state variable is used to fake offer/answer when they are wrongly
  // requested and we really just need to reuse what we already have.
  this.pcState = SimpleDataPeerState.DISCONNECTED;

  // Add basic event handlers.
  this.pc.addEventListener("icecandidate",
      this._onIceCallback.bind(this));
  this.pc.addEventListener("datachannel",
      this._onDataChannel.bind(this));
  this.pc.addEventListener("negotiationneeded",
      this._onNegotiationNeeded.bind(this));
  this.pc.addEventListener("signalingstatechange",
      this._onSignalingStateChange.bind(this));
  /* // Another way.
  this.pc.onicecandidate = this._onIceCallback.bind(this);
  this.pc.ondatachannel = this._onDataChannel.bind(this);
  this.pc.onnegotiationneeded = this._onNegotiationNeeded.bind(this);
  this.pc.onsignalingstatechange = this._onSignalingStateChange.bind(this);
  */

  // Start off with no open data channels.
  this.channels = {};
}

SimpleDataPeer.prototype.setSendSignalMessage = function (sendSignalMessageFn) {
  this._sendSignalMessage = sendSignalMessageFn;
}

// Handle a message send on the signalling channel to this peer.
SimpleDataPeer.prototype.handleSignalMessage = function (messageText) {
  trace.log(this._debugPeerName + ": " + "handleSignalMessage: \n" +
      messageText);
  var json = JSON.parse(messageText);
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
        trace.log(this._debugPeerName + ": " +
          "setRemoteDescription sucess:", this.pc.remoteDescription);
        if (this.pc.remoteDescription.type == "offer") {
          this.pc.createAnswer(this._onDescription.bind(this));
        }
      }.bind(this),
      // Failure
      function (e) {
        trace.error(this._debugPeerName + ": " +
          "setRemoteDescription failed:", e);
      }.bind(this));
  } else if (json.candidate) {
    // Add remote ice candidate.
    this.pc.addIceCandidate(new RTCIceCandidate(json.candidate));
  } else {
    trace.warn(this._debugPeerName + ": " +
        "handleSignalMessage got unexpected message: ", message);
  }
}

// Connect to the peer by the signalling channel.
SimpleDataPeer.prototype.negotiateConnection = function () {
  this.pcState = SimpleDataPeerState.CONNECTING;
  this.pc.createOffer(
    this._onDescription.bind(this),
    function(e) {
      trace.error(this._debugPeerName + ": " +
        "createOffer failed: ", e.toString());
      this.pcState = SimpleDataPeerState.DISCONNECTED;
    }.bind(this)
    );
}

// Create a new data channel.
SimpleDataPeer.prototype.openDataChannel = function (channelId, options) {
  // if no channel id is specified, fail.
  if (!channelId) {
    trace.error(this._debugPeerName + ": " +
        "No channelId given.");
    return null;
  }
  // If a channel with this label already exists, fail.
  if (channelId in this.channels) {
    trace.error(this._debugPeerName + ": " +
        "This channelId already exists: " + channelId);
    return null;
  }
  // Default to reliable channels.
  if (!options) {
    options = {'reliable': true}
  }
  // Create and setup the new data channel.
  var channel = this.pc.createDataChannel(channelId, options);
  this._setupDataChannel(channel);
  return channel;
}

SimpleDataPeer.prototype.sendMessage = function (channelId, message) {
  if (!(channelId in this.channels)) {
    trace.error(this._debugPeerName + ": " + "No such channel id: " +
        channelId);
    return;
  }
  var channel = this.channels[channelId];
  try {
    channel.send(message);
    trace.log(this._debugPeerName + ": " + "channels[" + channel.label + "]:" +
        "sent: ", message);
  } catch (e) {
    trace.error(this._debugPeerName + ": " + "channels[" + channel.label + "]: " +
        "send failed. channel:", channel, "\nException: ", e.toString());
  }
}

SimpleDataPeer.prototype.closeChannel = function (channelId) {
  this.channels[channelId].close();
  delete this.channels[channelId];
}

SimpleDataPeer.prototype.close = function() {
  for(var channelId in this.channels) {
    this.closeChannel(channelId);
  }
  this.pc.close();
  trace.log(this._debugPeerName + ": " + "Closed peer connection.");
}

// When we get our description, we set it to be our local description and
// send it to the peer.
SimpleDataPeer.prototype._onDescription = function (description) {
  if (this._sendSignalMessage) {
    this.pc.setLocalDescription(description,
        function() {
          this._sendSignalMessage(JSON.stringify({'sdp':description}));
        }.bind(this),
        function (e) {
          trace.error(this._debugPeerName + ": " +
            "setLocalDescription failed:", e);
        }.bind(this));
  } else {
    trace.error(this._debugPeerName + ": " + "_onDescription: _sendSignalMessage is not set, so we did not set the local description. ");
  }
}

//
SimpleDataPeer.prototype._onNegotiationNeeded = function (e) {
  trace.log(this._debugPeerName + ": " + "_onNegotiationNeeded", this.pc, e);
  if(this.pcState != SimpleDataPeerState.DISCONNECTED) {
    // Negotiation messages are falsely requested for new data channels.
    //   https://code.google.com/p/webrtc/issues/detail?id=2431
    // This code is a hack to simply reset the same local and remote
    // description which will trigger the appropriate data channel open event.
    // TODO: fix/remove this when Chrome issue is fixed.
    if (this.pc.localDescription && this.pc.remoteDescription && this.pc.localDescription.type == "offer") {
      this.pc.setLocalDescription(this.pc.localDescription,
          function() {
            trace.log(this._debugPeerName + ": " +
              "Fake setLocalDescription success:");
          }.bind(this),
          function (e) {
            trace.log(this._debugPeerName + ": " +
              "Fake setLocalDescription failed:", e);
          }.bind(this));
      this.pc.setRemoteDescription(this.pc.remoteDescription,
          function() {
            trace.log(this._debugPeerName + ": " +
              "Fake setRemoteDescription success:");
          }.bind(this),
          function (e) {
            trace.log(this._debugPeerName + ": " +
              "Fake setRemoteDescription failed:", e);
          }.bind(this));
    } else if (this.pc.localDescription && this.pc.remoteDescription && this.pc.localDescription.type == "answer") {
      this.pc.setRemoteDescription(this.pc.remoteDescription,
          function() {
            trace.log(this._debugPeerName + ": " +
              "Fake setRemoteDescription success:");
          }.bind(this),
          function (e) {
            trace.log(this._debugPeerName + ": " +
              "Fake setRemoteDescription failed:", e);
          }.bind(this));
      this.pc.setLocalDescription(this.pc.localDescription,
          function() {
            trace.log(this._debugPeerName + ": " +
              "Fake setLocalDescription success:");
          }.bind(this),
          function (e) {
            trace.log(this._debugPeerName + ": " +
              "Fake setLocalDescription failed:", e);
          }.bind(this));
    }
    return;
  }
  this.negotiateConnection();
}

SimpleDataPeer.prototype._onSignalingStateChange = function () {
  trace.log(this._debugPeerName + ": " + "_onSignalingStateChange: ",
      this.pc.signalingState);
  if (this.pc.signalingState == "stable") {
    this.pcState = SimpleDataPeerState.CONNECTED
  }
}

SimpleDataPeer.prototype._onIceCallback = function (event) {
  if (event.candidate) {
    // Send IceCandidate to peer.
    trace.log(this._debugPeerName + ": " + "ice callback with candidate", event);
    if (this._sendSignalMessage) {
      this._sendSignalMessage(JSON.stringify({'candidate': event.candidate}));
    } else {
      trace.warn(this._debugPeerName + ": " + "_onDescription: _sendSignalMessage is not set.");
    }
  }
}

SimpleDataPeer.prototype._onDataChannel = function (event) {
  this._setupDataChannel(event.channel);
}

SimpleDataPeer.prototype._setupDataChannel = function (channel) {
  if(channel.label in this.channels) {
    trace.warn("Channel with label '" + channel.label + "' already exists; closing the old one and creating a new one.");
    this.channels[channel.label].close();
  }
  this.channels[channel.label] = channel;

  if (this._debug) {
    /* // Another way to write the same thing.
    channel.onopen = this._onChannelStateChange.bind(this, channel);
    channel.onclose = this._onChannelStateChange.bind(this, channel);
    channel.onerror = this._onChannelStateChange.bind(this, channel);
    channel.onmessage = this._onMessageCallback.bind(this, channel);
    */
    channel.addEventListener('open',
        this._onChannelStateChange.bind(this, channel));
    channel.addEventListener('close',
        this._onChannelStateChange.bind(this, channel));
    channel.addEventListener('error',
        this._onChannelStateChange.bind(this, channel));
    channel.addEventListener('message',
        this._onMessageCallback.bind(this, channel));
  }
}

SimpleDataPeer.prototype._onChannelStateChange = function (channel) {
  trace.log(this._debugPeerName + ": " + "dataChannel(" + channel.label +
      "): " + "State changed: " + channel.readyState, event);
}

// Channel event handlers
SimpleDataPeer.prototype._onMessageCallback = function (channel, event) {
  trace.log(this._debugPeerName + ": " + "dataChannel(" + channel.label +
      "): " + "Received message event: ", event)
}

SimpleDataPeer.prototype.getChannelIds = function () {
  return Object.keys(this.channels);
}

SimpleDataPeer.prototype.getChannel = function (channelId) {
  return this.channels[channelId];
}

SimpleDataPeer.prototype.removeChannel = function (channelId) {
  delete this.channels[channelId];
}




//-----------------------------------------------------------------------------
// Smart wrapper for a data channels, including real notion of open an queuing
//-----------------------------------------------------------------------------
// Stores state of a datachannel. The issue is that even when a data channel is
// in state open, unless the other end is also open, sent messages may not be
// receieved. To ensure that sent messages are recieved, we send an initial ping
// - pong message and consider the chanel truly open once we get or send a pong
// message.

// TODO: remove PingPong; it's complex and shouldn't be needed. Also note that
// combined with the bad channel name sending bug, this will have problems if
// the channel name is 'ping' or 'pong'.
PingPongMessage =  {
  PING: 'ping',
  PONG : 'pong'
};
SmartDataChannelState =  {
  PENDING : 'pending', // waiting for channel to open.
  PINGED : 'pinged',  // I got a ping (and sent a pong)
  PONGED : 'ponged',  // I never got a ping message, but I got a pong.
  CONNECTED: 'connected',  // Have got both a ping and a pong from the peer.
  CLOSED : 'closed' // channel was closed.
};

function SmartDataChannel(channel, options, callbacks) {
  if (options) {
    this._debugPeerName = options.debugPeerName;
  } else {
    this._debugPeerName = "";
  }
  this.dataChannel = channel;
  this.state = SmartDataChannelState.PENDING;
  // queue of messages to send when the channel is ready.
  this.queue = [];

  // These are the DataPeer-level callbacks. They provide some abstraction over
  // underlying datachannels and peer connection. e.g. onOpen is called at the
  // point when sending messages will actualy work.
  var this._callbacks = {
    // onOpenFn is called at the point messages will actually get through.
    onOpenFn: function (smartDataChannel) {
      trace.log(smartDataChannel._debugPeerName + ": dataChannel(" +
        smartDataChannel.dataChannel.label +
        "): onOpenFn");
    },
    onCloseFn: function (smartDataChannel) {
      trace.log(smartDataChannel._debugPeerName + ": dataChannel(" +
        smartDataChannel.dataChannel.label +
        "): onCloseFn");
    },
    // Default on real message prints it to console.
    onMessageFn: function (smartDataChannel, event) {
      trace.log(smartDataChannel._debugPeerName + ": dataChannel(" +
          smartDataChannel.dataChannel.label +
          "): onMessageFn", event);
    },
    // Default on error, prints it.
    onErrorFn: function(smartDataChannel, event) {
      trace.error(smartDataChannel._debugPeerName + ": dataChannel(" +
          smartDataChannel.dataChannel.label + "): error: ", e);
    }
  };
  for(var cb_key in callbacks) {
    // Let the programmer know that a bad (unusable) callback key exists.
    if(!(cb_key in this._callbacks)) {
      trace.log(this._debugPeerName + ": Bad callback specified: " + cb_key +
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
  channel.addEventListener("error", this._callbacks._onError.bind(this));

  /* // Another way to write the same thing.
  channel.onopen = this._startPingPong.bind(this);
  channel.onclose = this._onClose.bind(this);
  channel.onerror = this._callbacks.onError.bind(this);
  */
}

SmartDataChannel.prototype._startPingPong = function () {
  // We bind _onPingPongMessageFn so that we can remove the event listener
  // later.
  this.dataChannel.addEventListener("message", this._onPingPongMessageFn);
  /* // Another way to write the same thing.
  this.dataChannel.onmessage = this._onPingPongMessageFn;
  */
  trace.log(this._debugPeerName + ": dataChannel(" + this.dataChannel.label +
      "): Sending PING");
  this.dataChannel.send(PingPongMessage.PING);
}

// This logic is complex. :(  TODO: this should not be needed; when a data
// channel is open, this should guarentee that the message will get to the other
// side. See issue: https://code.google.com/p/webrtc/issues/detail?id=2406&thanks=2406&ts=1379699312
SmartDataChannel.prototype._onPingPongMessage = function (event) {
  trace.log(this._debugPeerName + ": dataChannel(" + this.dataChannel.label +
      "): Message during PingPong startup: ", event);
  if (event.data == PingPongMessage.PING) {
    if (this.state == SmartDataChannelState.PONGED) {
      this._onConnected();
    } else if (this.state == SmartDataChannelState.PENDING) {
      this.dataChannel.send(PingPongMessage.PONG);
      this.state = SmartDataChannelState.PINGED;
    } else {
      trace.log(this._debugPeerName + ": dataChannel(" +
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
      trace.error(this._debugPeerName + ": dataChannel(" +
          this.dataChannel.label +
          "): unkown state for message: " + this.state);
    }
  } else {
    // Sometimes we get messages with a channel id when a channel starts up. I
    // think this is a bug:
    //   https://code.google.com/p/webrtc/issues/detail?id=2439
    // TODO: When that bug is fixed, add a warning here.
  }
}

SmartDataChannel.prototype._onError = function (e) {
  this._callbacks(this,e);
}

SmartDataChannel.prototype._onConnected = function () {
  trace.log(this._debugPeerName + ": dataChannel(" + this.dataChannel.label +
      "): CONNECTED", event);
  this.state = SmartDataChannelState.CONNECTED;
  this.dataChannel.removeEventListener("message", this._onPingPongMessageFn);
  this.dataChannel.addEventListener("message", this._onMessage.bind(this));
  this._callbacks.onOpenFn(this);
  this._sendQueuedMessages();
}

SmartDataChannel.prototype._sendQueuedMessages = function () {
  var message;
  while(message = this.queue.shift()) {
    this.dataChannel.send(message);
  }
}

SmartDataChannel.prototype._onMessage = function (event) {
  this._callbacks.onMessageFn(this, event);
}

SmartDataChannel.prototype._onClose = function () {
  this.close();
}

// Given an ArrayBuffer, a string, or a Blob, send it on the underlying data
// channel. If not connected, queues the message and sends it when connected.
SmartDataChannel.prototype.send = function (message) {
  if (this.state == SmartDataChannelState.CONNECTED) {
    this.dataChannel.send(message);
  } else {
    this.queue.push(message);
  }
}

SmartDataChannel.prototype.close = function () {
  if(this.dataChannel.readyState != "closed") {
    this.dataChannel.close();
  }
  this.state == SmartDataChannelState.CLOSED;
  this._callbacks.onCloseFn(this);
}


//-----------------------------------------------------------------------------
// A nicer wrapper for P2P data channels that uses SmartDataChannel
//-----------------------------------------------------------------------------
// A smart wrapper for data channels that queues messages.
function DataPeer(options, callbacks) {
  this.options = options;
  this.simplePeer = new SimpleDataPeer(this.options);
  this.ready = false;
  // The SmartChannel wrapper for each dataChannel in simplePeer
  // Invariant: Object.keys(this.simplePeer.channels) ==
  // Object.keys(this.smartChannels)
  this.smartChannels = {};

  // These are the DataPeer-level callbacks. They provide some abstraction over
  // underlying datachannels and peer connection. e.g. onOpen is called at the
  // point when sending messages will actualy work.
  var this._callbacks = {
    // onOpenFn is called at the point messages will actually get through.
    dataChannelCallbacks: {},
    onOpenChannelFn: function (smartDataChannel) {},
    onCloseChannel: function (smartDataChannel) {},
    onChannelMessage: function (smartDataChannel, event) {},
  };
  for(var cb_key in callbacks) {
    // Let the programmer know that a bad (unusable) callback key exists.
    if(!(cb_key in this._callbacks)) {
      trace.log(this.options.debugPeerName + ": Bad callback specified: " +
          cb_key + ". Being ignored.");
    } else { this._callbacks[cb_key] = callbacks[cb_key]; }
  }

  this.simplePeer.pc.addEventListener("datachannel",
      this._onOpenDataChannel.bind(this));
  /* // Another way
  this.simplePeer.pc.ondatachannel = this._onOpenDataChannel.bind(this);
  */
};

DataPeer.prototype.setSendSignalMessage = function (sendSignalMessageFn) {
  this.simplePeer.setSendSignalMessage(sendSignalMessageFn);
}

DataPeer.prototype._onOpenDataChannel = function (event) {
  this.smartChannels[event.channel.label] =
      new SmartDataChannel(event.channel, this.options,
          this._callbacks.dataChannelCallbacks);
}

// If channel doesn't already exist, start a new channel.
DataPeer.prototype.send = function (channelId, message) {
  if(!(channelId in this.smartChannels)) {
    this.openDataChannel(channelId)
  }
  this.smartChannels[channelId].send(message);
}

DataPeer.prototype.openDataChannel = function (channelId) {
  var channel = this.simplePeer.openDataChannel(channelId);
  this.smartChannels[channelId] = new SmartDataChannel(channel, this.options,
      this._callbacks.dataChannelCallbacks);
}

DataPeer.prototype.getChannelIds = function () {
  return this.simplePeer.getChannelIds();
}

DataPeer.prototype.getSmartDataChannel = function (channelId) {
  return this.smartChannels[channelId];
}

DataPeer.prototype.closeChannel = function (channelId) {
  if(!(channelId in this.simplePeer.channels)) {
    trace.warn(this.options.debugPeerName + ": " + "Trying to close a data channel id (" + channelId + ") that does not exist.");
    return;
  }
  this.smartChannels[channelId].close();
  var closedSmartChannel = this.smartChannels[channelId];
  delete this.smartChannels[channelId];
  this.simplePeer.removeChannel(channelId);
  this._callbacks.onCloseChannel(closedSmartChannel);
}

DataPeer.prototype.close = function () {
  for(var channelId in this.smartChannels) {
    this.closeChannel(channelId)
  }
  trace.log(this.options.debugPeerName + ": " + "Closed DataPeer.");
  this.simplePeer.close();
}

DataPeer.prototype.handleSignalMessage = function (message) {
  this.simplePeer.handleSignalMessage(message);
};
