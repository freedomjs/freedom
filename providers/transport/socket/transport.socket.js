var socket = freedom['core.socket']();
var core = freedome.core();


fdom.apis.set("core.socket", {
  'create': {type: "method", value: ["string", "object"]},
  'connect': {type: "method", value: ["number", "string", "number"]},
  'onData': {type: "event", value: {"socketId": "number", "data": "buffer"}},
  'write': {type: "method", value: ["number", "buffer"]},
  'disconnect': {type: "method", value: ["number"]},
  'destroy': {type: "method", value: ["number"]},
  'listen': {type: "method", value: ["number", "string", "number"]},
  'onConnection': {type: "event", value: {
    "serverSocketId": "number",
    "clientSocketId": "number"}},
  'getInfo': {type: "method", value: ["number"]}
});


function TransportProvider() {
  this.state = TransportProvider.state.DISCONNECTED;
  this.channel = null;
  this.socket = null;
}

TransportProvider.state = {
  DISCONNECTED: 0,
  CONNECTING: 1,
  CONNECTED: 2,
  CLOSED: 3
};

TransportProvider.prototype.open = function(freedomChannelId,
    initiateConnection, continuation) {
  if (this.state != TransportProvider.state.DISCONNECTED) {
    console.warn("Attempting to open connection in invalid state.");
    return continuation();
  }
  this.state = TransportProvider.state.CONNECTING;
  this.onOpen = continuation;
  this.initiating = initiateConnection;
  core.bindChannel(freedomChannelId).done(function(channel) {
    this.channel = channel;
    this.channel.on('message', function(msg) {

    }.bind(this));
    this.channel.on('close', function() {
      this.close();
    }.bind(this));
    this.connect();
  }.bind(this));
};

TransportProvider.prototype.connect = function() {
  socket.create("tcp", {}).done(function(socket) {
    this.socket = socket.socketId;
  }.bind(this));
};

// Called when data is received.
TransportProvider.prototype.message = function(msg) {
  this.dispatchEvent('message',
      {"channelid": msg.channelid, "data": msg.text});
};

TransportProvider.prototype.send = function(channelid, msg, continuation) {
};

TransportProvider.prototype.close = function(continuation) {
  this.peer.shutdown().done(continuation);
};

var transport = freedom.transport();
transport.provideAsynchronous(TransportProvider);
