/*
 * Peer 2 Peer transport provider.
 *
 */

function TransportProvider() {
  console.log("TransportProvider: running in worker " + self.location.href);
  this.name = null;
  this.pc = freedom['core.sctp-peerconnection']();
  this.pc.on('onReceived', this.onData.bind(this));
  this.pc.on('onClose', this.onClose.bind(this));
}

// The argument |channelId| is a freedom communication channel id to use
// to open a peer connection. 
TransportProvider.prototype.setup = function(name, channelId, continuation) {
  console.log("TransportProvider.setup." + name);
  this.name = name;
  var promise = this.pc.setup(channelId, name);
  promise.done(continuation);
};

TransportProvider.prototype.send = function(tag, data, continuation) {
  console.log("TransportProvider.send." + this.name);
  var promise = this.pc.send({"channelLabel": tag, "buffer": data});
  promise.done(continuation);
};

TransportProvider.prototype.close = function(continuation) {
  this.pc.close().done(continuation);
};

// Called when the peer-connection receives data, it then passes it here.
TransportProvider.prototype.onData = function(msg) {
  console.log("TransportProvider.prototype.message: Got Message:" + JSON.stringify(msg));
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

TransportProvider.prototype.onClose = function() {
  this.dispatchEvent('onClose', null);
};

// Note: freedom.transport() does not create a new transport instance here: for
// module definitions freedom.transport() gets the module-constructor-freedom-
// thing.
//
// TODO: change Freedom API so that it distinctly names the module-
// constructor-freedom-thing separately from the thing to create new modules.
freedom.transport().provideAsynchronous(TransportProvider);
