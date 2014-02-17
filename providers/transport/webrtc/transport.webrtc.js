/*
 * Peer 2 Peer transport provider.
 *
 */

var WebRTCTransportProvider = function(dispatchEvent) {
  this.dispatchEvent = dispatchEvent;
  this.name = null;
  this.pc = freedom['core.peerconnection']();
  this.pc.on('onReceived', this.onData.bind(this));
  this.pc.on('onClose', this.onClose.bind(this));
  this._tags = [];
};

WebRTCTransportProvider.stun_servers = [
  "stun:stun.l.google.com:19302",
  "stun:stun1.l.google.com:19302",
  "stun:stun2.l.google.com:19302",
  "stun:stun3.l.google.com:19302",
  "stun:stun4.l.google.com:19302"
];

// The argument |channelId| is a freedom communication channel id to use
// to open a peer connection. 
WebRTCTransportProvider.prototype.setup = function(name, channelId, continuation) {
  // console.log("TransportProvider.setup." + name);
  this.name = name;
  var promise = this.pc.setup(channelId, name, WebRTCTransportProvider.stun_servers);
  promise.then(continuation);
};

WebRTCTransportProvider.prototype.send = function(tag, data, continuation) {
  // console.log("TransportProvider.send." + this.name);
  if (this._tags.indexOf(tag) >= 0) {
    var promise = this.pc.send({"channelLabel": tag, "buffer": data});
    promise.then(continuation);
  } else {
    this.pc.openDataChannel(tag).then(function(){
      this._tags.push(tag);
      this.send(tag, data, continuation);
    }.bind(this));
  }
};

WebRTCTransportProvider.prototype.close = function(continuation) {
  // TODO: Close data channels.
  this._tags = [];
  this.pc.close().then(continuation);
};

// Called when the peer-connection receives data, it then passes it here.
WebRTCTransportProvider.prototype.onData = function(msg) {
  // console.log("TransportProvider.prototype.message: Got Message:" + JSON.stringify(msg));
  if (msg.buffer) {
    this.dispatchEvent('onData', {
      "tag": msg.channelLabel, 
      "data": msg.buffer
    });
  } else if (msg.text) {
    console.error("Strings not supported.");
  } else if (msg.blob) {
    console.error("Blob is not supported.");
  } else {
    console.error('message called without a valid data field');
  }
};

WebRTCTransportProvider.prototype.onClose = function() {
  this._tags = [];
  this.dispatchEvent('onClose', null);
};

/** REGISTER PROVIDER **/
if (typeof freedom !== 'undefined') {
  freedom.transport().provideAsynchronous(WebRTCTransportProvider);
}
