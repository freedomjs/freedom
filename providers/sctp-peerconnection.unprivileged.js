/**
 * A FreeDOM interface to a WebRTC Peer Connection.
 * @param Channel channel a channel for emitting events.
 * @constructor
 * @private
 */

var SctpPeerConnection = function(channel) {
  // a (hopefully unique) ID for debugging.
  this.debugId = "p" + Math.random();

  window.SctpPcs = window.SctpPcs || {};
  // For debugging.
  window.SctpPcs[this.debugId] = this;

  // A freedom channel to be connected to a freedom channel identifier that
  // sends messages to/from the identity.
  this.signallingChannel = channel;
  // The peer connection
  this.peerConnection = null;
  // function to be called when ice candidates are received.
  this.onIceCandidate = null;

  // Mapping from channelid to the PeerConnection data channel for that
  // channelid.
  this.dataChannels = {};
  // An array of messages, indexed by their corresponding data channel label,
  // that are waiting to be sent on the data channel.
  //
  // Invaraint: key in this.dataChannels == key in this.msgQueue
  this.msgQueue = {};

  // TODO: explain what kind of events are being handled here.
  handleEvents(this);
};

// Set options
SctpPeerConnection.prototype.setup =
    function(options, continuation) {
  this.debugId = options.debugID || this.debugId;
  continuation();
};

// Start a peer connection using the given freedomChannelID as the way to
// communicate with the peer. The argument |freedomChannelId| is a way to speak
// to an identity provide to send them SDP headers negotiate the address/port to
// setup the peer to peerConnection.
SctpPeerConnection.prototype.startup =
    function(freedomChannelId, initiate, continuation) {
  // The RTCPeerConnection object.
  var RTCPeerConnection = RTCPeerConnection || webkitRTCPeerConnection || mozRTCPeerConnection;
  this.peerConnection = new RTCPeerConnection(null,
      {'optional': [{'DtlsSrtpKeyAgreement': true}]});
  // TODO: should we try to handle peer connection events?

  // For debugging in the webworker:
  console.log("SctpPeerConnection(" + this.debugId + "): " +
      self.location.href);
  window.pc = this.peerConnection;

  // When a data channel is created, this peer connection will receive an event
  // and should then setup the data channel.
  //
  // TODO: should we do some kind of check, in case we want to reject it? e.g.
  // if the key doesn't match or we havn't allowed peer connection to this peer?
  this.peerConnection.addEventListener('datachannel',
      function (e) {
        console.log("SctpPeerConnection(" + this.debugId + "): " +
          "'datachannel' event datachannel.label=" +  e['channel'].label);
        this._setupDataChannel(e['channel']);
      }.bind(this));

  //this.peerConnection.ondatachannel = function(e) {
  //  console.log('peerConnection datachannel event receieved for datachannel labeled: ' +  e['channel'].label);
//    this._setupDataChannel(e['channel']).bind(this);
//  };

  // Listen for messages to/from the provided message channel.
  this.signallingChannel = Core_unprivileged.bindChannel(
      this.signallingChannel, freedomChannelId);
  this.signallingChannel.on('message', this._onSignal.bind(this));
  this.signallingChannel.emit('ready');

  // Remove old event listener; and create new one for this signalling channel.
  this.peerConnection.removeEventListener(this.onIceCandidate);
  this.onIceCandidate = function(evt) {
    if(evt && evt['candidate']) {
      this.signallingChannel.emit('message', JSON.stringify(evt['candidate']));
    } else {
      // Note: it is normal to get onIceCandidiate events with no candidate.
      // console.error('Got unexpected event at onIceCandidate: ', evt);
    }
  }.bind(this);
  // Send all ice candidates received to the signalling channel.
  this.peerConnection.addEventListener('icecandidate',
      this.onIceCandidate, true);

  // Make and send offer down the signalling channel.
  if(initiate) {
    this._makeOffer();
    this.postMessage({channelid: "test", text: "ping"}, function () {});
  }

  continuation();
};

// Setup a data channel's event listeners and add it to the this.dataChannels
// object that indexes channels by label.
SctpPeerConnection.prototype._setupDataChannel =
    function (dataChannel) {
  console.log("SctpPeerConnection(" + this.debugId + "): " +
      'Setting up dataChannel(' + dataChannel.label + ')');

  if(this.dataChannels[dataChannel.label]) {
    console.error('A channel with this channelid is already setup: ' + dataChannel.label);
    return;
  }

  this.dataChannels[dataChannel.label] = dataChannel;
  this.msgQueue[dataChannel.label] = [];

  // add event listener to send all messages once the channel is opened.
  dataChannel.addEventListener('open', function() {
    console.log("SctpPeerConnection(" + this.debugId + "): " +
        "dataChannel(" + dataChannel.label + ") opened.");
    this._sendMessages(dataChannel.label);
  }.bind(this), true);

  // When this data channel receives data, pass it on to Freedom listeners.
  dataChannel.addEventListener('message', function(m) {
    console.log("SctpPeerConnection(" + this.debugId + "): " +
        "dataChannel(" + dataChannel.label + "):" +
        "got message event: " + JSON.stringify(m));
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
    this.closeDataChannel(dataChannel.label, function() {});
    this['dispatchEvent']('onClose', dataChannel.label);
  }.bind(this), true);
};

SctpPeerConnection.prototype.closeDataChannel =
    function(channelid, continuation) {
    this.dataChannels[channelid].close();
    delete this.dataChannels[channelid];
    delete this.msgQueue[channelid];
    continuation();
};

// Make and send an offer to connect to the peerConnection.
SctpPeerConnection.prototype._makeOffer = function() {
  console.log("SctpPeerConnection(" + this.debugId + "): " +
      "_makeOffer.");
  //if (this.remotePid < this.myPid) {
  //  return;
  //}
  this.peerConnection.createOffer(function(desc) {
    this.peerConnection.setLocalDescription(desc);
    // desc['pid'] = this.myPid;
    console.log("SctpPeerConnection(" + this.debugId + "): " +
        "_makeOffer:", desc);
    this.signallingChannel.emit('message', JSON.stringify(desc));
  }.bind(this));
};

SctpPeerConnection.prototype._makeAnswer = function(remoteDesc) {
  console.log("SctpPeerConnection(" + this.debugId + "): " +
      "_makeAnswer.");
  this.peerConnection.createAnswer(function(desc) {
    this.peerConnection.setLocalDescription(desc);
    // desc['pid'] = this.myPid;
    console.log("SctpPeerConnection(" + this.debugId + "): " +
        "_makeAnswer:", desc);
    this.signallingChannel.emit('message', JSON.stringify(desc));
  }.bind(this));
};

// Called when signalling channel receives a message.
// TODO: add a restriction to only setup a peer connection if to
// expected peers?
SctpPeerConnection.prototype._onSignal = function(msg) {
  //try {
    /* console.log('_onSignal:' + msg + ';\n\n signalingState: ' +
        this.peerConnection.signalingState + '\n\n localDescription: ' +
        this.peerConnection.localDescription + '\n\n remoteDescription: ' +
        this.peerConnection.remoteDescription);
    */

    var m = msg;
    if (typeof msg === "string") {
      m = JSON.parse(msg);
    }
    if (m['candidate']) {
      // TODO: add ice candidates on to a queue if there is no
      // remoteDescription.
      //
      // When we get sent more ice candidates by the peer, add them.
      var candidate = new RTCIceCandidate(m);
      this.peerConnection.addIceCandidate(candidate);
    } else if (m['type'] == 'offer') {
      var remoteDesc = new RTCSessionDescription(m);
      this.peerConnection.setRemoteDescription(remoteDesc,
          function() {
            //console.log('Set remote description from offer!');
            this._makeAnswer(remoteDesc);
          }.bind(this),
          function(e) {
            //console.error("Failed to set remote description: ", e);
          });
    } else if (m['type'] == 'answer') {
      // When we get an asnwer set the remote description.
      this.peerConnection.setRemoteDescription(new RTCSessionDescription(m));
    } else {
      console.warn("SctpPeerConnection(" + this.debugId + "): " +
          "onSignal: ignored message:" + JSON.stringify(msg));
    }
  //} catch(e) {
  //  console.error("Error with signalling message: " + JSON.stringify(msg) + ": -> " + e.message);
  //}
};

// Send all messages on a given channelid. Assumes the channelid corresponds to
// an opened datachannel.
SctpPeerConnection.prototype._sendMessages =
    function (channelid) {
  if (!(channelid in this.dataChannels)) {
    console.error("SctpPeerConnection(" + this.debugId + "): " +
        '_sendMessage: No such channelid: ' + channelid);
    return;
  }

  console.log("SctpPeerConnection(" + this.debugId + "): " +
      "_sendMessages on dataChannel(" + channelid + "): " +
      "length: " + this.msgQueue[channelid].length);
  while(this.msgQueue[channelid].length > 0) {
    var msg = this.msgQueue[channelid].shift();
    console.log("SctpPeerConnection(" + this.debugId + "): " +
        "_sendMessages on dataChannel(" + channelid + "): " +
        "message: " + JSON.stringify(msg));
    console.log("SctpPeerConnection(" + this.debugId + "): " +
        "_sendMessages on dataChannel(" + channelid + "): ",
        this.dataChannels[channelid]);
    if(msg.text) {
      this.dataChannels[channelid].send(msg.text);
    } else if(msg.buffer) {
      this.dataChannels[channelid].send(msg.buffer);
    } else {
      console.error("SctpPeerConnection(" + this.debugId + "): " +
          "_sendMessages: unsupported msg type in msg.", post.msg);
    }
  }
};

// Called to send a message over a datachannel to a peer.
SctpPeerConnection.prototype.postMessage =
    function(msg, continuation) {
  console.log("SctpPeerConnection(" + this.debugId + "): " +
      'postMessage: dataChannel(' + msg.channelid + ")");
  // If dataChanel doesn't already exist with this id, make it.
  if (!(msg.channelid in this.dataChannels)) {
    this._setupDataChannel(this.peerConnection
        .createDataChannel(msg.channelid, {'reliable': true}));
  }

  this.msgQueue[msg.channelid].push(msg);
  if (this.dataChannels[msg.channelid].readyState != 'open') {
    // Queue until open if channel is not ready.
    console.log("SctpPeerConnection(" + this.debugId + "): " +
        "dataChannel(" + msg.channelid + "): " +
        "is not open (readyState: " +
        this.dataChannels[msg.channelid].readyState + "), delaying send.");
  } else {
    this._sendMessages(msg.channelid);
  }

  // Note: we don't postpone the continutation, the post has been queued is all
  // we primise to do.
  continuation();
};

SctpPeerConnection.prototype.shutdown = function() {
  if (this.peerConnection) {
    try {
      this.peerConnection.close();
    } catch(e) {
      // Warn on already-closed errors.
      console.warn("SctpPeerConnection(" + this.debugId + "): " +
          'Trying to closed an already closed peerConnection.', e);
    }
    delete this.peerConnection;
  }
};

fdom.apis.register('core.sctp-peerconnection', SctpPeerConnection);
