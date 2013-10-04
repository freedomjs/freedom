// A FreeDOM interface to a WebRTC Peer Connection via the peerdata wrapper.

// _signallingChannel is a channel for emitting events back to the freedom Hub.
var SctpPeerConnection = function(portApp) {
  this.options = {
    // a (hopefully unique) ID for debugging.
    debugPeerName: "p" + Math.random(),
    debug: false;
  };

  // For debugging.
  window.datapeers = window.datapeers || {};
  window.datapeers[this.debugPeerName] = this;

  // This is the portApp (defined in freedom/src/port-app.js). A way to speak
  // to freedom.
  this._portApp = portApp;

  // This is the a channel to send signalling messages.
  this._signallingChannel = null;

  // The DataPeer object for talking to the peer.
  this._peer = null;

  // This makes the constructed object (this) intro a core freedom module with
  // "on", "emit", and "once" methods.
  // handleEvents(this);  // Not needed as we don't use them.
};

// Start a peer connection using the given freedomChannelId as the way to
// communicate with the peer. The argument |freedomChannelId| is a way to speak
// to an identity provide to send them SDP headers negotiate the address/port to
// setup the peer to peerConnection.
//
// options: {
//   debugPeerName: string,   // For pretty printing messages about this peer.
//   debug: boolean           // should we add extra
// }
SctpPeerConnection.prototype.setup =
    function(signallingChannelId, options, continuation) {

  for (var k in options) { this.options[k] = options[k]; }

  var self = this;
  var dataChannelCallbacks = {
    // onOpenFn is called at the point messages will actually get through.
    onOpenFn: function (smartDataChannel) {
      console.log(smartDataChannel.peerName + ": dataChannel(" +
        smartDataChannel.dataChannel.label +
        "): onOpenFn");
      self.dispatchEvent("onOpenDataChannel", event.channel.label);
    },
    onCloseFn: function (smartDataChannel) {
      console.log(smartDataChannel.peerName + ": dataChannel(" +
        smartDataChannel.dataChannel.label +
        "): onCloseFn");
      self.dispatchEvent("onCloseDataChannel", event.channel.label);
    },
    // Default on real message prints it to console.
    onMessageFn: function (smartDataChannel, event) {
      console.log(smartDataChannel.peerName + ": dataChannel(" +
          smartDataChannel.dataChannel.label +
          "): onMessageFn", event);
      if (event.data instanceof ArrayBuffer) {
        var data = new Uint8Array(event.data);
        console.log(smartDataChannel.peerName + ": dataChannel(" +
          smartDataChannel.dataChannel.label +
          "): " + "Got ArrayBuffer data: ", data);
        self.dispatchEvent('onMessage', {'buffer': event.data});
      } else if (typeof(event.data) == 'string') {
        console.log(smartDataChannel.peerName + ": dataChannel(" +
          smartDataChannel.dataChannel.label +
          "): " + "Got string data: ", event.data);
        self.dispatchEvent('onMessage', {'text': event.data});
      } else {
        console.error(smartDataChannel.peerName + ": dataChannel(" +
          smartDataChannel.dataChannel.label +
          "): " + "Got unkown data :( ");
      }
    },
    // Default on error, prints it.
    onErrorFn: function(smartDataChannel, err) {
      console.error(smartDataChannel.peerName + ": dataChannel(" +
          smartDataChannel.dataChannel.label + "): error: ", err);
    }
  };

  this._peer = new DataPeer(this.options, dataChannelCallbacks);

  // Setup link between Freedom messaging and _peer's signalling.
  this._signallingChannel = Core_unprivileged.bindChannel(
      this._portApp, signallingChannelId);
  this._peer.setSendSignalMessage(
      this._signallingChannel.emit.bind(null, "message"));
  this._signallingChannel.on('message',
      this._peer.handleSignalMessage.bind(this._peer));
  this._signallingChannel.emit('ready');

  continuation();
};

// TODO: delay continuation until the open callback rom _peer is called.
SctpPeerConnection.prototype.openDataChannel =
    function(channelId, continuation) {
  this._peer.openDataChannel(channelId);
  continuation();
};

SctpPeerConnection.prototype.closeDataChannel =
    function(channelId, continuation) {
  this._peer.closeDataChannel(channelId);
  continuation();
};

// Called to send a message over the given datachannel to a peer. If the data
// channel doesn't already exist, the DataPeer creates it.
SctpPeerConnection.prototype.send =
    function(channelId, message, continuation) {
  this._peer.send(channelId, message);
  continuation();
};

SctpPeerConnection.prototype.shutdown = function(continuation) {
  this._peer.close();
  continuation();
};

fdom.apis.register('core.sctp-peerconnection', SctpPeerConnection);



