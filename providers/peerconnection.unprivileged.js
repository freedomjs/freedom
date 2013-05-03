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
      this['dispatchEvent']('message', {"text": m.data});
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
  console.log("Making offer as " + this.myPid);
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
  console.log("Making answer as " + this.myPid);
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
    } else if (m['type'] == 'offer') {
      if (m['pid'] == this.remotePid || m['pid'] == this.myId) {
        return;
      } else {
        console.log("remote pid " + this.remotePid + " mismatch w/ " + m['pid']);
      }
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
    } else if (m['type'] == 'answer' && m['pid'] != this.myId && this.remotePid != m['pid']) {
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

  // TODO(willscott): Handle send of binary data.
  console.log("Sending transport data.");
  this.dataChannel.send(ref);
  continuation();
};

PeerConnection_unprivileged.prototype.close = function(continuation) {
  delete this.dataChannel;

  if (this.connection) {
    this.connection.close();
  }
  continuation();
};

fdom.apis.register("core.peerconnection", PeerConnection_unprivileged);
