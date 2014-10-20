/*jslint indent:2,sloppy:true, node:true */

var adapter = require('webrtc-adapter');
var RTCPeerConnection = adapter.RTCPeerConnection;
var RTCSessionDescription = adapter.RTCSessionDescription;
var RTCIceCandidate = adapter.RTCIceCandidate;

var DataChannel = require('./core.rtcdatachannel');

var RTCPeerConnectionAdapter = function (app, dispatchEvent, configuration) {
  this.dispatchEvent = dispatchEvent;
  this.connection = new RTCPeerConnection(configuration);

  this.events = [
    'ondatachannel',
    'onnegotiationneeded',
    'onicecandidate',
    'onsignalingstatechange',
    'onaddstream',
    'onremovestream',
    'oniceconnectionstatechange'
  ];
  this.manageEvents(true);
};

// Attach or detach listeners for events against the connection.
RTCPeerConnectionAdapter.prototype.manageEvents = function (attach) {
  this.events.forEach(function (event) {
    if (attach) {
      this[event] = this[event].bind(this);
      this.connection[event] = this[event];
    } else if (this.connection) {
      delete this.connection[event];
    }
  }.bind(this));
};

RTCPeerConnectionAdapter.prototype.createOffer = function (constraints, callback) {
  this.connection.createOffer(callback, callback.bind({}, undefined), constraints);
};

RTCPeerConnectionAdapter.prototype.createAnswer = function (callback) {
  this.connection.createAnswer(callback, callback.bind({}, undefined));
};

RTCPeerConnectionAdapter.prototype.setLocalDescription = function (description, callback) {
  this.connection.setLocalDescription(new RTCSessionDescription(description),
    callback,
    callback.bind({}, undefined));
};

RTCPeerConnectionAdapter.prototype.getLocalDescription = function (callback) {
  callback(this.connection.localDescription);
};

RTCPeerConnectionAdapter.prototype.setRemoteDescription = function (description, callback) {
  this.connection.setRemoteDescription(new RTCSessionDescription(description),
    callback,
    callback.bind({}, undefined));
};

RTCPeerConnectionAdapter.prototype.getRemoteDescription = function (callback) {
  callback(this.connection.remoteDescription);
};

RTCPeerConnectionAdapter.prototype.getSignalingState = function (callback) {
  callback(this.connection.signalingState);
};

RTCPeerConnectionAdapter.prototype.updateIce = function (configuration, callback) {
  this.connection.updateIce(configuration);
  callback();
};

RTCPeerConnectionAdapter.prototype.addIceCandidate = function (candidate, callback) {
  this.connection.addIceCandidate(new RTCIceCandidate(candidate),
    callback,
    callback.bind({}, undefined));
};

RTCPeerConnectionAdapter.prototype.getIceGatheringState = function (callback) {
  callback(this.connection.iceGatheringState);
};

RTCPeerConnectionAdapter.prototype.getIceConnectionState = function (callback) {
  callback(this.connection.iceConnectionState);
};

RTCPeerConnectionAdapter.prototype.getConfiguration = function (callback) {
  var configuration = this.connection.getConfiguration();
  callback(configuration);
};

RTCPeerConnectionAdapter.prototype.getLocalStreams = function (callback) {
  callback(undefined, {
    errcode: -1,
    message: "Not Implemented"
  });
};

RTCPeerConnectionAdapter.prototype.getRemoteStreams = function (callback) {
  callback(undefined, {
    errcode: -1,
    message: "Not Implemented"
  });
};

RTCPeerConnectionAdapter.prototype.getStreamById = function (id, callback) {
  callback(undefined, {
    errcode: -1,
    message: "Not Implemented"
  });
};

RTCPeerConnectionAdapter.prototype.addStream = function (id, callback) {
  callback(undefined, {
    errcode: -1,
    message: "Not Implemented"
  });
};

RTCPeerConnectionAdapter.prototype.removeStream = function (id, callback) {
  callback(undefined, {
    errcode: -1,
    message: "Not Implemented"
  });
};

RTCPeerConnectionAdapter.prototype.close = function (callback) {
  if (!this.connection) {
    return callback();
  }
  this.manageEvents(false);
  try {
    this.connection.close();
    callback();
  } catch (e) {
    callback(undefined, {
      errcode: e.name,
      message: e.message
    });
  }
};

RTCPeerConnectionAdapter.prototype.createDataChannel = function (label, dataChannelDict, callback) {
  var id = DataChannel.allocate(this.connection.createDataChannel(label, dataChannelDict));
  callback(id);
};

RTCPeerConnectionAdapter.prototype.getStats = function (callback) {
  this.connection.getStats(callback, callback.bind(this, undefined));
};

RTCPeerConnectionAdapter.prototype.ondatachannel = function (event) {
  var id = DataChannel.allocate(event.channel);
  this.dispatchEvent('ondatachannel', {channel: id});
};

RTCPeerConnectionAdapter.prototype.onnegotiationneeded = function (event) {
  console.warn('on negotiation eeded');
  this.dispatchEvent('onnegotiationneeded', event.message);
};

RTCPeerConnectionAdapter.prototype.onicecandidate = function (event) {
  var msg;
  if (event.candidate && event.candidate.candidate) {
    msg = {
      candidate: {
        candidate: event.candidate.candidate,
        sdpMid: event.candidate.sdpMid,
        sdpMLineIndex: event.candidate.sdpMLineIndex
      }
    };
  } else {
    msg = {
      candidate: null
    };
  }
  this.dispatchEvent('onicecandidate', msg);
};
  
RTCPeerConnectionAdapter.prototype.onsignalingstatechange = function (event) {
  this.dispatchEvent('onsignalingstatechange', event.message);
};
  
RTCPeerConnectionAdapter.prototype.onaddstream = function (event) {
  //TODO: provide ID of allocated stream.
  this.dispatchEvent('onaddstream', event.stream);
};
  
RTCPeerConnectionAdapter.prototype.onremovestream = function (event) {
  //TODO: provide ID of deallocated stream.
  this.dispatchEvent('onremovestream', event.stream);
};
  
RTCPeerConnectionAdapter.prototype.oniceconnectionstatechange = function (event) {
  this.dispatchEvent('oniceconnectionstatechange', event.message);
};
  

exports.name = "core.rtcpeerconnection";
exports.provider = RTCPeerConnectionAdapter;
