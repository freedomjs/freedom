/**
 * A FreeDOM interface to WebRTC Peer Connections
 * @param Channel channel a channel for emitting events.
 * @constructor
 * @private
 */
var SctpPeerConnection_unprivileged = function(channel) {
  // A freedom channel to be connected to a freedom channel identifier that
  // sends messages to/from the identity.
  this.signallingChannel = channel;
  // function to be called when ice candidates are received.
  this.onIceCandidate = null;

  // Mapping from channelid to the PeerConnection data channel for that
  // channelid.
  this.dataChannels = {};
  // An array of messages, indexed by their corresponding data channel label,
  // that are waiting to be sent on the data channel.
  //
  // Invaraint: key in this.dataChannels == key in this.postQueue
  this.postQueue = {};

  // The RTCPeerConnection object.
  var RTCPeerConnection = RTCPeerConnection || webkitRTCPeerConnection || mozRTCPeerConnection;
  this.peerConnection = new RTCPeerConnection(null,
      {'optional': [{'DtlsSrtpKeyAgreement': true}]});
  // TODO: should we try to handle peer connection events?

  // When a data channel is created, this peer connection will receive an event
  // and should then setup the data channel.
  //
  // TODO: should we do some kind of check, in case we want to reject it? e.g.
  // if the key doesn't match or we havn't allowed peer connection to this peer?
  this.peerConnection.addEventListener('datachannel', function(e) {
    console.log('peerConnection datachannel event receieved for datachannel labeled: ' +  e['channel'].label);
    this._setupDataChannel(e['channel']);
  }.bind(this));

  // TODO: explain what kind of events are being handled here.
  handleEvents(this);
};

// |freedomChannelId| is a way to speak to an identity provide to send them SDP
// headers negotiate the address/port to setup the peer to peerConnection.
SctpPeerConnection_unprivileged.prototype.setSignallingChannel =
    function(freedomChannelId, continuation) {
  // Listen for messages to/from the provided message channel.
  this.signallingChannel = Core_unprivileged.bindChannel(
      this.signallingChannel, freedomChannelId);
  this.signallingChannel.on('message', this.onSignal.bind(this));
  this.signallingChannel.emit('ready');

  // Remove old event listener; and create new one for this signalling channel.
  this.peerConnection.removeEventListener(this.onIceCandidate);
  this.onIceCandidate = function(evt) {
    if(evt && evt['candidate']) {
      this.signallingChannel.emit('message', JSON.stringify(evt['candidate']));
    }
  }.bind(this);
  // Send all ice candidates received to the signalling channel.
  this.peerConnection.addEventListener('icecandidate',
      this.onIceCandidate, true);

  continuation();
};

// Setup a data channel's event listeners and add it to the this.dataChannels
// object that indexes channels by label.
SctpPeerConnection_unprivileged.prototype._setupDataChannel =
    function (dataChannel) {
  console.log('Setting up datachannel: ' + dataChannel.label);

  if(this.dataChannels[dataChannel.label]) {
    console.error('A channel with this channelid is already setup: ' + dataChannel.label);
    return;
  }

  this.dataChannels[dataChannel.label] = dataChannel;
  this.postQueue[dataChannel.label] = [];

  // add event listener to send all messages once the channel is opened.
  dataChannel.addEventListener('open', function() {
      console.log("Data channel " + dataChannel.label + " opened.");
      this._sendMessages(dataChannel.label);
    }.bind(this), true);

  // When this data channel receives data, pass it on to Freedom listeners.
  dataChannel.addEventListener('message', function(m) {
    console.log("dataChannel: message event: " + JSON.stringify(m));
    if(typeof(m.data) === 'string') {
      this['dispatchEvent']('message',
          {channelid: dataChannel.label, "text" : m.data});
    } else if(m.data instanceof ArrayBuffer) {
      this['dispatchEvent']('message',
          {channelid: dataChannel.label, "buffer" : m.data});
    } else if(m.data instanceof Blob) {
      this['dispatchEvent']('message',
          {channelid: dataChannel.label, "blob" : m.data});
    } else {
      // Error: unkown/unsupported type of data.
      var typ_description;
      if(typeof(m.data) === 'object') {
        typ_description = "object(" + m.data.constructor.name + ")";
      } else {
        typ_description = typeof(m.data);
      }
      console.error('Unkown type of data received on data channel: ' +
          typ_description);
    }
  }.bind(this), true);

  dataChannel.addEventListener('close', function() {
    delete this.dataChannels[dataChannel.label];
    this['dispatchEvent']('onClose', dataChannel.label);
  }.bind(this), true);
};

SctpPeerConnection_unprivileged.prototype.closeDataChannel =
    function(channelid) {
    delete this.dataChannels[channelid];
    delete this.postQueue[channelid];
};

// Make and send an offer to connect to the peerConnection.
SctpPeerConnection_unprivileged.prototype.makeOffer = function() {
  console.log("SctpPeerConnection_unprivileged.prototype.makeOffer.");
  if (this.remotePid < this.myPid) {
    return;
  }
  this.peerConnection.createOffer(function(desc) {
    this.peerConnection.setLocalDescription(desc);
    desc['pid'] = this.myPid;
    console.log("SctpPeerConnection_unprivileged.prototype.makeOffer:", desc);
    this.signallingChannel.emit('message', JSON.stringify(desc));
  }.bind(this));
};

SctpPeerConnection_unprivileged.prototype.makeAnswer = function() {
  console.log("SctpPeerConnection_unprivileged.prototype.makeAnswer.");
  this.peerConnection.createAnswer(function(desc) {
    this.peerConnection.setLocalDescription(desc);
    desc['pid'] = this.myPid;
    console.log("SctpPeerConnection_unprivileged.prototype.makeAnswer:", desc);
    this.signallingChannel.emit('message', JSON.stringify(desc));
  }.bind(this));
};

// Called when signalling channel receives a message.
SctpPeerConnection_unprivileged.prototype.onSignal = function(msg) {
  try {
    var m = msg;
    if (typeof msg === "string") {
      m = JSON.parse(msg);
    }
    if (m['candidate']) {
      var candidate = new RTCIceCandidate(m);
      this.peerConnection.addIceCandidate(candidate);
    } else if (m['type'] == 'offer' && m['pid'] != this.myId) {
      this.remotePid = m['pid'];
      if (this.remotePid < this.myPid) {
        this.close(function() {
          // ??? Do we need to do more resetting?
          this.peerConnection.setRemoteDescription(new RTCSessionDescription(m), function() {}, function() {
            console.error("Failed to set remote description");
          });
          this.makeAnswer();
        }.bind(this));
      } else {
        // They'll get my offer and send an answer.
      }
    } else if (m['type'] == 'answer' && m['pid'] != this.myId) {
      this.remotePid = m['pid'];
      this.peerConnection.setRemoteDescription(new RTCSessionDescription(m));
    } else {
      console.warn("SctpPeerConnection_unprivileged.prototype.onSignal: ignored message:" + JSON.stringify(msg));
    }
  } catch(e) {
    console.error("Error with signalling message: " + JSON.stringify(msg) + ": -> " + e.message);
  }
};

// Send all messages on a given channelid. Assumes the channelid corresponds to
// an opened datachannel.
SctpPeerConnection_unprivileged.prototype._sendMessage =
    function (channelid) {
  if (!(channelid in this.dataChannels)) {
    console.error('No such channel in _sendMessage for given channelid: ' + channelid);
    return;
  }

  for(var i = 0; i++; i < this.postQueue[channelid].size) {
    var msg = this.postQueue[channelid].pop();
    if(msg.text) {
      this.dataChannels[channelid].send(msg.text);
    } else if(msg.buffer) {
      this.dataChannels[channelid].send(msg.buffer);
    } else {
      console.error("postMessage got unsupported msg to send over the " +
          "data channel." + JSON.stringify(msg));
    }
  }
};

// Called to send a message over a datachannel to a peer.
SctpPeerConnection_unprivileged.prototype.postMessage =
    function(msg, continuation) {
  console.log('postMessage to dataChannel: ' + msg.channelid);
  // If dataChanel doesn't already exist with this id, make it.
  if (!(msg.channelid in this.dataChannels)) {
    console.log('setting up new dataChannel: ' + msg.channelid);
    this._setupDataChannel(this.peerConnection
        .createDataChannel(msg.channelid, {'reliable': true}));
  }

  this.postQueue[msg.channelid].push({msg: msg, continuation: continuation});
  if (this.dataChannels[msg.channelid].readyState != 'open') {
    // Queue until open if channel is not ready.
    console.log("Data channel " + msg.channelid +
        "is not open (readyState: " +
        this.dataChannels[msg.channelid].readyState + "), delaying send.");
  } else {
    // sendMessages is responsible for calling the continutaion.
    this._sendMessage(msg.channelid);
  }
};

// Called to close all connections.
SctpPeerConnection_unprivileged.prototype.close = function(continuation) {
  delete this.dataChannel;

  if (this.peerConnection) {
    try {
      this.peerConnection.close();
    } catch(e) {
      console.warn('Trying to closed an already closed peerConnection.', e);
      // Ignore already-closed errors.
    }
    delete this.peerConnection;
  }
  continuation();
};

fdom.apis.register('core.sctp-peerconnection', SctpPeerConnection_unprivileged);
