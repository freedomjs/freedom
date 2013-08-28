/**
 * A FreeDOM interface to WebRTC Peer Connections
 * @param Channel channel a channel for emitting events.
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
  this.sendQueue = [];
  handleEvents(this);
};

PeerConnection_unprivileged.prototype.open = function(proxy, continuation) {
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

PeerConnection_unprivileged.prototype.setup = function(initiate) {
  var RTCPeerConnection = RTCPeerConnection || webkitRTCPeerConnection || mozRTCPeerConnection;
  this.connection = new RTCPeerConnection(null, {'optional': [{'RtpDataChannels': true}]});

  var dcSetup = function() {
    this.dataChannel.addEventListener('open', function() {
      console.log("Data channel opened.");
      this.emit('open');
    }.bind(this), true);
    this.dataChannel.addEventListener('message', function(m) {
      // TODO(willscott): Support native binary transport, rather than this mess
      if (this.parts > 0) {
        this.buf += m.data;
        this.parts--;
        console.log('waiting for ' + this.parts + ' more parts.');
        if (this.parts === 0) {
          console.log("binary data recieved (" + this.buf.length + " bytes)");
          var databuf = JSON.parse(this.buf);
          var arr = new Uint8Array(databuf['binary']);
          var blob = new Blob([arr.buffer], {"type": databuf['mime']});
          this['dispatchEvent']('message', {"binary": blob, "buffer" : arr.buffer});
          this.buf = "";
        }
        return;
      }
      var data = JSON.parse(m.data);
      if (data['text']) {
        this['dispatchEvent']('message', {"text": data['text']});
      } else {
        this.parts = data['binary'];
        console.log("Beginning receipt of binary data (" + this.parts + " parts)");
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
      this.appChannel.emit('message', JSON.stringify(evt['candidate']));
    }
  }.bind(this), true);

  this.makeOffer();
};

PeerConnection_unprivileged.prototype.makeOffer = function() {
  if (this.remotePid < this.myPid) {
    return;
  }
  this.connection.createOffer(function(desc) {
    this.connection.setLocalDescription(desc);
    desc['pid'] = this.myPid;
    this.appChannel.emit('message', JSON.stringify(desc));
  }.bind(this));
};

PeerConnection_unprivileged.prototype.makeAnswer = function() {
  this.connection.createAnswer(function(desc) {
    this.connection.setLocalDescription(desc);
    desc['pid'] = this.myPid;
    this.appChannel.emit('message', JSON.stringify(desc));
  }.bind(this));
};

PeerConnection_unprivileged.prototype.onIdentity = function(msg) {
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
};

PeerConnection_unprivileged.prototype.postMessage = function(ref, continuation) {
  if (!this.connection) {
    return continuation(false);
  }
  // Queue until open.
  if (!this.dataChannel || this.dataChannel.readyState != "open") {
    return this.once('open', this.postMessage.bind(this, ref, continuation));
  }
  window.dc = this.dataChannel;

  if(ref['text']) {
    this.sendQueue.push(JSON.stringify({"text":ref['text']}));
    console.log("Sending text: " + ref['text']);
    this._process();
  } else if(ref['binary']) {
    // TODO(willscott): implement direct blob support when available.
    console.log("Transmitting " + ref['binary'].size + " binary bytes");
    var reader = new FileReader();
    reader.addEventListener('load', function(type, ev) {
      var arr = [];
      arr.push.apply(arr, new Uint8Array(ev.target.result));
      // Chunk messages so that packets are below MTU.
      var MAX_LEN = 512;
      var str = JSON.stringify({"mime": type, "binary": arr});
      var parts = Math.ceil(str.length / MAX_LEN);
      console.log("Sending chunked " + type + " ("+ str.length + " bytes)");
      this.sendQueue.push(JSON.stringify({"binary": parts}));

      while (str.length > 0) {
        this.sendQueue.push(str.substr(0, MAX_LEN));
        str = str.substr(MAX_LEN);
      }
      this._process();
    }.bind(this, ref['binary'].type), true);

    reader.readAsArrayBuffer(ref['binary']);
  }
  continuation();
};

PeerConnection_unprivileged.prototype._process = function(scheduled) {
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
    var STEP = 300;
    this.scheduled = setTimeout(this._process.bind(this, true), STEP);
  }
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
