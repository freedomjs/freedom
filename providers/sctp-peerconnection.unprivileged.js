// A FreeDOM interface to a WebRTC Peer Connection.



// freedomChannelId is a channel for emitting events back to the freedom Hub.
var SctpPeerConnection = function(freedomChannel) {
  this.options = {
    // a (hopefully unique) ID for debugging.
    debugPeerName: "p" + Math.random(),
    debug: false;
  };

  // For debugging.
  window.SctpPcs = window.SctpPcs || {};
  window.SctpPcs[this.debugId] = this;

  // A freedom channel id to be connected to a freedom channel identifier that
  // sends messages to/from the identity.
  this._freedomChannel = freedomChannel;

  // The DataPeer object for talking to the peer.
  this._peer = null;

  // This makes the constructed object (this) intro a proper freedom module with
  // "on" "emit" and "once" methods.
  handleEvents(this);
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
  this._peer = new DataPeer(this.options);

  //
  this._peer.addEventListener("datachannel", function(event) {
    this.emit("onOpenDataChannel", event.channel.label);
    event.channel.addEventListener("")
  }.bind(this));

  // Setup link between Freedom messaging and _peer's signalling.
  this._peer.setSendSignalMessage(
      this.freedomChannel.emit.bind(null, "message"));
  this.freedomChannel = Core_unprivileged.bindChannel(
      this._freedomChannel, signallingChannelId);
  this.freedomChannel['on']('onMessage',
      this._peer.handleSignalMessage.bind(this._peer));

  continuation();
};


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
