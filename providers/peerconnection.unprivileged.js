/**
 * A FreeDOM interface to WebRTC Peer Connections
 * @constructor
 * @private
 */
var PeerConnection_unprivileged = function(channel) {
  this.channel = channel;
  this.identity = null;
  this.connection = null;
  handleEvents(this);
};

PeerConnection_unprivileged.prototype.open = function(proxy, id, continuation) {
  if (this.connection) {
    continuation(false);
  }

  this.identity = fdom.Hub.get();
  this.backchannel = function(msg) {
    this.identity.postMessage({
      'action': 'method',
      'type': 'send',
      'value': msg
    });
  }

  var RTCPeerConnection = RTCPeerConnection || webkitRTCPeerConnection || mozRTCPeerConnection;
  this.connection = new RTCPeerConnection(null, {'optional': [{'RtpDataChannels': true}]});

  this.connection.addEventListener('icecandidate', function(evt) {
    if(evt && evt['candidate']) {
      this.backchannel(JSON.stringify(evt['candidate']));
    }
  }.bind(this), true);

  this.connection.createOffer(function(desc) {
    this.connection.setLocalDescription(desc);
    this.backchannel(JSON.stringify(desc));
  }.bind(this));

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
