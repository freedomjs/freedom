/**
 * A FreeDOM interface to WebRTC Peer Connections
 */
var PeerConnection_unprivileged = function(channel) {
  this.channel = channel;
  handleEvents(this);
};

PeerConnection_unprivileged.prototype.open = function(proxy, continuation) {
  continuation();
};

PeerConnection_unprivileged.prototype.postMessage = function(data, continuation) {
  continuation();
};

PeerConnection_unprivileged.prototype.close = function(continuation) {
  continuation();
};

fdom.apis.register("core.peerconnection", PeerConnection_unprivileged);
