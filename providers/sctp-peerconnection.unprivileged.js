/**
 * A FreeDOM interface to WebRTC Peer Connections
 * @param Channel channel a channel for emitting events.
 * @constructor
 * @private
 */
var SctpPeerConnection_unprivileged = function(channel) {
  this.appChannel = channel;
  this.dataChannel = null;
  this.identity = null;
  this.connection = null;
  this.myPid = Math.random();
  this.remotePid = 1;
  this.sendQueue = [];
  handleEvents(this);
};

// |proxy| is a channel to speak to a remote user to send them SDP headers/
// negotiate the address/port to setup the peer to peer connection.
SctpPeerConnection_unprivileged.prototype.open = function(proxy, continuation) {
  if (this.connection) {
    continuation(false);
  }

  // Listen for messages to/from the provided message channel.
  this.appChannel = Core_unprivileged.bindChannel(this.appChannel, proxy);
  this.appChannel['on']('message', this.onIdentity.bind(this));
  this.appChannel.emit('ready');

  this.setup(true);
  continuation();
};

// When initiate is true, we initiate the peer connection.
SctpPeerConnection_unprivileged.prototype.setup = function(initiate) {
  var RTCPeerConnection = RTCPeerConnection || webkitRTCPeerConnection || mozRTCPeerConnection;
  this.connection = new RTCPeerConnection(null,
      {'optional': [{'DtlsSrtpKeyAgreement': true}]});

  var dcSetup = function() {
    this.dataChannel.addEventListener('open', function() {
      console.log("Data channel opened.");
      this.emit('open');
    }.bind(this), true);
    // When this data channel receives data, pass it on to Freedom listeners.
    this.dataChannel.addEventListener('message', function(m) {
      // TODO: handle other types of data, e.g. text.
      if(typeof(m.data) === 'string') {
        this['dispatchEvent']('message', {"text" : m.data});
      } else if(m.data instanceof ArrayBuffer) {
        this['dispatchEvent']('message', {"buffer" : m.data});
      } else {
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
    this.dataChannel.addEventListener('close', function(conn) {
      if (this.connection == conn) {
        this['dispatchEvent']('onClose');
        this.close(function() {});
      }
    }.bind(this, this.connection), true);
  }.bind(this);

  if (initiate) {
    this.dataChannel = this.connection.createDataChannel("sendChannel", {'reliable': true});
    dcSetup();
  } else {
    this.connection.addEventListener('datachannel', function(evt) {
      this.dataChannel = evt['channel'];
      dcSetup();
    }.bind(this));
  }

  this.connection.addEventListener('icecandidate', function(evt) {
    if(evt && evt['candidate']) {
      this.appChannel.emit('message', JSON.stringify(evt['candidate']));
    }
  }.bind(this), true);

  this.makeOffer();
};

SctpPeerConnection_unprivileged.prototype.makeOffer = function() {
  if (this.remotePid < this.myPid) {
    return;
  }
  this.connection.createOffer(function(desc) {
    this.connection.setLocalDescription(desc);
    desc['pid'] = this.myPid;
    this.appChannel.emit('message', JSON.stringify(desc));
  }.bind(this));
};

SctpPeerConnection_unprivileged.prototype.makeAnswer = function() {
  this.connection.createAnswer(function(desc) {
    this.connection.setLocalDescription(desc);
    desc['pid'] = this.myPid;
    this.appChannel.emit('message', JSON.stringify(desc));
  }.bind(this));
};

SctpPeerConnection_unprivileged.prototype.onIdentity = function(msg) {
  try {
    var m = msg;
    if (typeof msg === "string") {
      m = JSON.parse(msg);
    }
    if (m['candidate']) {
      var candidate = new RTCIceCandidate(m);
      this.connection.addIceCandidate(candidate);
    } else if (m['type'] == 'offer' && m['pid'] != this.myId) {
      this.remotePid = m['pid'];
      if (this.remotePid < this.myPid) {
        this.close(function() {
          this.setup(false);
          this.connection.setRemoteDescription(new RTCSessionDescription(m), function() {}, function() {
            console.error("Failed to set remote description");
          });
          this.makeAnswer();
        }.bind(this));
      } else {
        // They'll get my offer and send an answer.
      }
    } else if (m['type'] == 'answer' && m['pid'] != this.myId) {
      this.remotePid = m['pid'];
      this.connection.setRemoteDescription(new RTCSessionDescription(m));
    }
  } catch(e) {
    console.error("Couldn't understand identity message: " + JSON.stringify(msg) + ": -> " + e.message);
  }
};

SctpPeerConnection_unprivileged.prototype.postMessage =
    function(m, continuation) {
  if (!this.connection) {
    return continuation(false);
  }
  // Queue until open.
  if (!this.dataChannel || this.dataChannel.readyState != "open") {
    return this.once('open', this.postMessage.bind(this, m, continuation));
  }
  // For debugging
  // window.dc = this.dataChannel;

  this.dataChannel.send(m['buffer']);

  continuation();
};

SctpPeerConnection_unprivileged.prototype._process = function(scheduled) {
  if (this.scheduled && !scheduled) {
    return;
  }

  var next = this.sendQueue.shift();
  this.dataChannel.send(next);

  if (this.scheduled) {
    clearTimeout(this.scheduled);
    delete this.scheduled;
  }

  if (this.sendQueue.length) {
    this.scheduled = setTimeout(this._process.bind(this, true), 0);
  }
};

SctpPeerConnection_unprivileged.prototype.close = function(continuation) {
  delete this.dataChannel;

  if (this.connection) {
    try {
      this.connection.close();
    } catch(e) {
      console.warn('Closed an already closed connection.', e);
      // Ignore already-closed errors.
    }
    delete this.connection;
  }
  continuation();
};

fdom.apis.register('core.sctp-peerconnection', SctpPeerConnection_unprivileged);
