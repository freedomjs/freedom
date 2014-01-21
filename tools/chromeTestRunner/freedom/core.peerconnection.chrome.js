// A FreeDOM interface to a WebRTC Peer Connection via the peerdata wrapper.

// _signallingChannel is a channel for emitting events back to the freedom Hub.
function SctpPeerConnection(portApp) {
  // This is the portApp (defined in freedom/src/port-app.js). A way to speak
  // to freedom.
  this._portApp = portApp;
  fdom.util.handleEvents(this);
  // a (hopefully unique) ID for debugging.
  this.peerName = "p" + Math.random();

  // For debugging.
  window.datapeers = window.datapeers || {};
  window.datapeers[this.peerName] = this;


  // This is the a channel to send signalling messages.
  this._signallingChannel = null;

  // The DataPeer object for talking to the peer.
  this._peer = null;

  // The Core object for managing channels.
  this._portApp.once('core', function(Core) {
    this._core = new Core();
  }.bind(this));
  this._portApp.emit(this._portApp.controlChannel, {
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
SctpPeerConnection.prototype.setup =
    function(signallingChannelId, peerName, continuation) {
  this.peerName = peerName;
  var self = this;

  var dataChannelCallbacks = {
    // onOpenFn is called at the point messages will actually get through.
    onOpenFn: function (smartDataChannel) {
/*      console.log(smartDataChannel.peerName + ": dataChannel(" +
        smartDataChannel.dataChannel.label +
        "): onOpenFn"); */
      self.dispatchEvent("onOpenDataChannel",
          smartDataChannel.dataChannel.label);
    },
    onCloseFn: function (smartDataChannel) {
/*      console.log(smartDataChannel.peerName + ": dataChannel(" +
        smartDataChannel.dataChannel.label +
        "): onCloseFn"); */
      self.dispatchEvent("onCloseDataChannel",
                         { channelId: smartDataChannel.dataChannel.label});
    },
    // Default on real message prints it to console.
    onMessageFn: function (smartDataChannel, event) {
      // These were filling the console, and causing the console to
      // hog the CPU.
/*      console.log(smartDataChannel.peerName + ": dataChannel(" +
          smartDataChannel.dataChannel.label +
          "): onMessageFn", event); */
      if (event.data instanceof ArrayBuffer) {
        var data = new Uint8Array(event.data);
/*        console.log(smartDataChannel.peerName + ": dataChannel(" +
          smartDataChannel.dataChannel.label +
          "): " + "Got ArrayBuffer (onReceived) data: ", data); */
        self.dispatchEvent('onReceived',
            { 'channelLabel': smartDataChannel.dataChannel.label,
              'buffer': event.data });
      } else if (typeof(event.data) == 'string') {
/*        console.log(smartDataChannel.peerName + ": dataChannel(" +
          smartDataChannel.dataChannel.label +
          "): " + "Got string (onReceived) data: ", event.data); */
        self.dispatchEvent('onReceived',
            { 'channelLabel': smartDataChannel.dataChannel.label,
              'text': event.data });
      } else {
/*        console.error(smartDataChannel.peerName + ": dataChannel(" +
          smartDataChannel.dataChannel.label +
          "): " + "Got unkown data :( "); */
      }
    },
    // Default on error, prints it.
    onErrorFn: function(smartDataChannel, err) {
      console.error(smartDataChannel.peerName + ": dataChannel(" +
          smartDataChannel.dataChannel.label + "): error: ", err);
    }
  };

  this._peer = new DataPeer(this.peerName, dataChannelCallbacks);

  // Setup link between Freedom messaging and _peer's signalling.
  // Note: the signalling channel should only be sending receiveing strings.
  this._core.bindChannel(signallingChannelId, function(channel) {
    this._signallingChannel = channel;
    this._peer.setSendSignalMessage(
        this._signallingChannel.emit.bind(this._signallingChannel, "message"));
    this._signallingChannel.on('message',
        this._peer.handleSignalMessage.bind(this._peer));
    this._signallingChannel.emit('ready');
    continuation();
  }.bind(this));

};

// TODO: delay continuation until the open callback rom _peer is called.
SctpPeerConnection.prototype.openDataChannel =
    function(channelId, continuation) {
  this._peer.openDataChannel(channelId, continuation);
};

SctpPeerConnection.prototype.closeDataChannel =
    function(channelId, continuation) {
  this._peer.closeChannel(channelId);
  continuation();
};

// Called to send a message over the given datachannel to a peer. If the data
// channel doesn't already exist, the DataPeer creates it.
SctpPeerConnection.prototype.send = function(sendInfo, continuation) {
  var objToSend = sendInfo.text || sendInfo.buffer || sendInfo.binary;
  if (typeof objToSend === 'undefined') {
    console.error("No valid data to send has been provided.", sendInfo);
    return;
  }
  this._peer.send(sendInfo.channelLabel, objToSend, continuation);
};

SctpPeerConnection.prototype.shutdown = function(continuation) {
  this._peer.close();
  continuation();
};

