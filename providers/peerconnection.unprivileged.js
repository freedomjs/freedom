/**
 * A FreeDOM interface to WebRTC Peer Connections
 * @constructor
 * @private
 */
var PeerConnection_unprivileged = function(channel) {
  this.appChannel = channel;
  this.dataChannel = null;
  this.identity = null;
  this.connection = null;
  this.myPid = Math.random();
  this.remotePid = 1;
  handleEvents(this);
};

PeerConnection_unprivileged.prototype.open = function(proxy, continuation) {
  if (this.connection) {
    continuation(false);
  }

  // Listen for messages to/from the provided message channel.
  this.appChannel = Core_unprivileged.bindChannel(proxy);
  this.appChannel['on']('message', this.onIdentity.bind(this));
  this.appChannel.postMessage({
    'type': 'ready',
    'action': 'event'
  });

  this.setup(true);
  continuation();
}

PeerConnection_unprivileged.prototype.setup = function(initiate) {
  var RTCPeerConnection = RTCPeerConnection || webkitRTCPeerConnection || mozRTCPeerConnection;
  this.connection = new RTCPeerConnection(null, {'optional': [{'RtpDataChannels': true}]});

  var dcSetup = function() {
    this.dataChannel.addEventListener('open', function() {
      console.log("Data channel opened.");
      this.emit('open');
    }.bind(this), true);
    this.dataChannel.addEventListener('message', function(m) {
      // TODO(willscott): Handle receipt of binary data.
      if (this.parts > 0) {
        this.buf += m.data;
        this.parts--;
        if (this.parts == 0) {
          var data = JSON.parse(this.buf);
          var blob = new Blob([data['binary']], {"type": data['mime']});
          this['dispatchEvent']('message', {"binary": blob});
          this.buf = "";
        }
        return;
      }
      var data = JSON.parse(m.data);
      if (data['text']) {
        this['dispatchEvent']('message', {"text": data['text']});
      } else {
        this.parts = data['binary'];
        this.buf = "";
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
    this.dataChannel = this.connection.createDataChannel("sendChannel", {'reliable': false});
    dcSetup();
  } else {
    this.connection.addEventListener('datachannel', function(evt) {
      this.dataChannel = evt['channel'];
      dcSetup();
    }.bind(this));
  }

  this.connection.addEventListener('icecandidate', function(evt) {
    if(evt && evt['candidate']) {
      this.appChannel.postMessage({
        'type': 'message',
        'action': 'event',
        'data': JSON.stringify(evt['candidate'])
      });
    }
  }.bind(this), true);

  this.makeOffer();
}

PeerConnection_unprivileged.prototype.makeOffer = function() {
  if (this.remotePid < this.myPid) {
    return;
  }
  this.connection.createOffer(function(desc) {
    this.connection.setLocalDescription(desc);
    desc['pid'] = this.myPid;
    this.appChannel.postMessage({
      'type': 'message',
      'action': 'event',
      'data': JSON.stringify(desc)
    });
  }.bind(this));
}

PeerConnection_unprivileged.prototype.makeAnswer = function() {
  this.connection.createAnswer(function(desc) {
    this.connection.setLocalDescription(desc);
    desc['pid'] = this.myPid;
    this.appChannel.postMessage({
      'type': 'message',
      'action': 'event',
      'data': JSON.stringify(desc)
    });
  }.bind(this));
}

PeerConnection_unprivileged.prototype.onIdentity = function(msg) {
  try {
    var m = JSON.parse(msg.data);
    if (m['candidate']) {
      var candidate = new RTCIceCandidate(m);
      this.connection.addIceCandidate(candidate);
    } else if (m['type'] == 'offer' && m['pid'] != this.myId) {
      this.remotePid = m['pid'];
      if (this.remotePid < this.myPid) {
        this.close(function() {
          this.setup(false);
          this.connection.setRemoteDescription(new RTCSessionDescription(m), function() {}, function() {
            console.log("Failed to set remote description");
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
    console.log("Couldn't understand identity message: " + JSON.stringify(msg) + ": -> " + e.message);
  }
}

PeerConnection_unprivileged.prototype.postMessage = function(ref, continuation) {
  if (!this.connection) {
    return continuation(false);
  }
  // Queue until open.
  if (!this.dataChannel || this.dataChannel.readyState != "open") {
    return this.once('open', this.postMessage.bind(this, ref, continuation));
  }

  console.log("Sending transport data.");
  if(ref['text']) {
    console.log("Sending text: " + ref['text']);
    this.dataChannel.send(JSON.stringify({"text":ref['text']}));
  } else if(ref['binary']) {
    // TODO(willscott): implement direct blob sending.
    var reader = new FileReader();
    reader.addEventListener('load', function(type, ev) {
      // Chunk message so that packets work.
      var MAX_LENGTH = 512;
      var str = JSON.stringify({"mime": type, "binary": ev.target.result});
      var parts = Math.ceil(str.length / MAX_LENGTH);
      this.dataChannel.send(JSON.stringify({"binary": parts}));
      while (str.length > 0) {
        this.dataChannel.send(str.substr(0, MAX_LENGTH));
        str = str.substr(MAX_LENGTH);
      }
    }.bind(this, ref['binary'].type), true);
    reader.readAsBinaryString(ref['binary']);
  }
  continuation();
};

PeerConnection_unprivileged.prototype.close = function(continuation) {
  delete this.dataChannel;

  if (this.connection) {
    try {
      this.connection.close();
    } catch(e) {
      // Ignore already-closed errors.
    }
    delete this.connection;
  }
  continuation();
};

fdom.apis.register("core.peerconnection", PeerConnection_unprivileged);
