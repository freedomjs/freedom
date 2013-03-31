/**
 * A FreeDOM interface to WebRTC Peer Connections
 */
var PeerConnection_unprivileged = function(channel) {
  this.channel = channel;
  this.identity = null;
  this.connection = null;
  handleEvents(this);
};

PeerConnection_unprivileged.prototype.open = function(proxy, id, continuation) {
  this.identity = fdom.Hub.get().
  continuation();
};

PeerConnection_unprivileged.prototype.postMessage = function(data, continuation) {
  if (!this.connection) {
    return continuation(false);
  }
  this.connection.send(data['text']);
  continuation();
};

PeerConnection_unprivileged.prototype.close = function(continuation) {
  if (this.connection) {
    this.connection.close();
  }
  continuation();
};

fdom.apis.register("core.peerconnection", PeerConnection_unprivileged);
