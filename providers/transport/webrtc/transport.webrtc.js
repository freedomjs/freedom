var stun_servers = [
  "stun:stun.l.google.com:19302",
  "stun:stun1.l.google.com:19302",
  "stun:stun2.l.google.com:19302",
  "stun:stun3.l.google.com:19302",
  "stun:stun4.l.google.com:19302"
];

/*
 * Peer 2 Peer transport provider.
 *
 */

function TransportProvider() {
  // console.log("TransportProvider: running in worker " + self.location.href);
  this.name = null;
  this.pc = freedom['core.peerconnection']();
  this.pc.on('onReceived', this.onData.bind(this));
  this.pc.on('onClose', this.onClose.bind(this));
  this.pc.on('onOpenDataChannel', this.onNewTag.bind(this));
  this._tags = [];
  // Entries in this dictionary map tags to chunks of messages. If
  // there is no entry for a tag in the dictionary, then we have not
  // received the first chunk of the next message.
  this._chunks = {};
  // Messages may be limited to a 16KB length
  // http://tools.ietf.org/html/draft-ietf-rtcweb-data-channel-07#section-6.6
  this._chunkSize = 15000;
  // Javascript has trouble representing integers larger than 2^53 exactly
  this._maxMessageSize = Math.pow(2, 53);
}

// The argument |channelId| is a freedom communication channel id to use
// to open a peer connection. 
TransportProvider.prototype.setup = function(name, channelId, continuation) {
  // console.log("TransportProvider.setup." + name);
  this.name = name;
  var promise = this.pc.setup(channelId, name, stun_servers);
  promise.done(continuation);
};

TransportProvider.prototype.send = function(tag, data, continuation) {
  // console.log("TransportProvider.send." + this.name);
  if (this._tags.indexOf(tag) >= 0) {
    this._sendInChunks(tag, data, continuation);
  } else {
    this.pc.openDataChannel(tag).done(function(){
      this._tags.push(tag);
      this.send(tag, data, continuation);
    }.bind(this));
  }
};

TransportProvider.prototype._sendInChunks = function(tag, data, continuation) {
  // We send in chunks. The first 8 bytes of the first chunk of a
  // message encodes the number of bytes in the message.
  var dataView = new Uint8Array(data);
  var promises = [];
  var promise;
  var size = data.byteLength;
  var lastByteSent = 0; // exclusive range
  
  var sizeBuffer = this._sizeToBuffer(size);
  var bufferToSend = new Uint8Array(Math.min(this._chunkSize,
                                             size + sizeBuffer.byteLength));

  bufferToSend.set(sizeBuffer, 0);
  var end = Math.min(this._chunkSize - sizeBuffer.byteLength,
                     bufferToSend.byteLength);
  bufferToSend.set(dataView.subarray(0, end), sizeBuffer.byteLength);
  promise = this.pc.send({"channelLabel": tag, "buffer": bufferToSend.buffer});
  promises.push(promise);
  lastByteSent = end;

  while (lastByteSent < size) {
    end = lastByteSent + this._chunkSize;
    promise = this.pc.send({"channelLabel": tag,
                            "buffer": data.slice(lastByteSent, end)});
    promises.push(promise);
    // We are fudging the numbers here a little. lastByteSent may be
    // greater than the actual number of bytes if we have sent all of
    // the bytes already.
    lastByteSent = end;
  }

  function promiseReturnFactory(promise) {
    return function() {
      return promise;
    };
  }
  var nextPromise;
  promise = promises.shift();
  nextPromise = promise;

  while (promises.length > 0) {
    nextPromise = promises.shift();
    promise.done(promiseReturnFactory(nextPromise));
    promise = nextPromise;
  }
  nextPromise.done(continuation);
};

TransportProvider.prototype.close = function(continuation) {
  // TODO: Close data channels.
  this._tags = [];
  this.pc.close().done(continuation);
};

// Called when the peer-connection receives data, it then passes it here.
TransportProvider.prototype.onData = function(msg) {
  // console.log("TransportProvider.prototype.message: Got Message:" + JSON.stringify(msg));
  if (msg.buffer) {
    this._handleData(msg.channelLabel, msg.buffer);
  } else if (msg.text) {
    console.error("Strings not supported.");
  } else if (msg.blob) {
    console.error("Blob is not supported.");
  } else {
    console.error('message called without a valid data field');
  }
};

TransportProvider.prototype._handleData = function(tag, buffer) {
  var currentTag;
  if (tag in this._chunks) {
    currentTag = this._chunks[tag];
    currentTag.buffers.push(buffer);
    currentTag.currentByteCount += buffer.byteLength;
  } else {
    currentTag = {buffers: [],
                  currentByteCount: 0,
                  totalByteCount: 0};
    this._chunks[tag] = currentTag;
    var size = this._bufferToSize(buffer.slice(0, 8));
    if (size > this._maxMessageSize) {
      console.warn("Incomming message is larger than maximum message size, this may also ");
    }
    currentTag.totalByteCount = size;
    currentTag.buffers.push(buffer.slice(8));
    currentTag.currentByteCount += buffer.byteLength - 8;
  }

  if(currentTag.currentByteCount === currentTag.totalByteCount) {
    var returnBuffer = this._assembleBuffers(tag);
    this.dispatchEvent('onData', {
      "tag": tag, 
      "data": returnBuffer
    });
    delete this._chunks[tag];
  } else if(currentTag.currentByteCount > currentTag.totalByteCount) {
    console.warn("Received more bytes for message than expected, something has gone seriously wrong");
    delete this._chunks[tag];
  }
  
};

TransportProvider.prototype.onNewTag = function(event) {
  this._tags.push(event.channelId);
};

TransportProvider.prototype.onClose = function() {
  this._tags = [];
  this.dispatchEvent('onClose', null);
};


TransportProvider.prototype._sizeToBuffer = function(size) {
  // Bit shifts have overflow issues for any integers with more than
  // 32 bits, so use division.
  var buffer = new ArrayBuffer(8);
  var view = new Uint8Array(buffer);
  for (var index = 0; index < 8; index++) {
    var currentByte = size & 0xff;
    view [ index ] = currentByte;
    size = (size - currentByte) / 256 ;
  }
  return view;
};

TransportProvider.prototype._bufferToSize = function(buffer) {
  var view = new Uint8Array(buffer);
  var number = 0;
  for ( var i = view.byteLength - 1; i >= 0; i--) {
    number = (number * 256) + view[i];
  }

  return number;
};

/*
 * Reassemble the buffers for the given tag into a single ArrayBuffer object.
 * @param {String} 
 * @return {ArrayBuffer} Result of concatenating all buffers for tag
 */
TransportProvider.prototype._assembleBuffers = function(tag) {
  var size = this._chunks[tag].totalByteCount;
  var bytesCopied = 0;
  var result = new ArrayBuffer(size);
  var view = new Uint8Array(result);
  this._chunks[tag].buffers.forEach(function(buffer) {

    view.set(new Uint8Array(buffer), bytesCopied);
    bytesCopied += buffer.byteLength;
  });
  return result;
};

/** REGISTER PROVIDER **/
if (typeof freedom !== 'undefined') {
  freedom.transport().provideAsynchronous(TransportProvider);
}

function printBuffer(buffer) {
  var test = new Uint8Array(buffer);
  for (var i = 0; i < buffer.byteLength; i++) {
       console.log(test[i]);
  }
}
