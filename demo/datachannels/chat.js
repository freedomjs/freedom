/*jslint node:true*/
/*globals freedom*/
'use strict';

/**
 * This is the root module of the datachannel freedom.js demo.
 * It runs in an isolated thread with its own namespace,
 * peerconnection and datachannel objects are provided through
 * freedom.
 **/
var Chat = function (dispatchEvents, name) {
  this.dispatchEvent = dispatchEvents;
  this.name = name;
  this.connection = freedom['core.rtcpeerconnection']();
  this.connection.on(function (type, msg) {
    if (type === 'onsignalingstatechange' ||
        type === 'onnegotiationneeded' ||
        type === 'oniceconnectionstatechange') {
      this.dispatchEvent('message', '<small style="color:gray">' + type + '</small>');
    } else if (type === 'onicecandidate') {
      if (msg) {
        this.dispatchEvent('ice', JSON.stringify(msg));
      }
      this.dispatchEvent('message', '<small style="color:lightgray">Ice Candidate Produced</small>');
    } else if (type === 'ondatachannel') {
      this.dispatchEvent('message', '<small style="color:blue">Data Channel Ready [Recipient]</small>');
      this.channel = freedom['core.rtcdatachannel'](msg.channel);
      this.channel.on(this.onDataChannelMsg.bind(this));
    } else {
      this.dispatchEvent('message', JSON.stringify({type: type, msg: msg}));
    }
  }.bind(this));
};

Chat.prototype.onDataChannelMsg = function (type, msg) {
  if (type === 'onopen' || type === 'onclose') {
    this.dispatchEvent('message', '<small style="color:blue">Data Channel Ready</small>');
  } else if (type === 'onmessage') {
    this.dispatchEvent('message', '<strong style="color:blue">' + msg.text + '</strong>');
  } else {
    this.dispatchEvent('message', JSON.stringify({type: type, msg: msg}));
  }
};

Chat.prototype.initiate = function (options, callback) {
  this.connection.createDataChannel(this.name).then(function (id) {
    this.channel = freedom['core.rtcdatachannel'](id);
    this.channel.on(this.onDataChannelMsg.bind(this));
    this.connection.createOffer(options).then(function (description) {
      this.connection.setLocalDescription(description);
      callback(description);
    }.bind(this));
  }.bind(this));
};

Chat.prototype.respond = function (offer, callback) {
  var parts = offer.split('\n');
  this.handleSignals(parts)
    .then(this.connection.createAnswer)
    .then(function (description) {
      this.connection.setLocalDescription(description);
      callback(description);
    }.bind(this));
};

Chat.prototype.handleSignals = function (stack) {
  var next = stack.shift(),
    obj = JSON.parse(next),
    promise;
  if (obj.sdp) {
    promise = this.connection.setRemoteDescription(obj);
  } else if (obj.candidate) {
    promise = this.connection.addIceCandidate(obj.candidate);
  }
  if (stack.length) {
    return promise.then(this.handleSignals.bind(this, stack));
  } else {
    return promise;
  }
};

Chat.prototype.finish = function (answer, callback) {
  var parts = answer.split('\n');
  this.handleSignals(parts)
    .then(callback);
};

Chat.prototype.openChannel = function (callback) {
  this.connection.createDataChannel(this.name).then(function (id) {
    console.log('channel created');
    callback(id);
  }.bind(this));
};

Chat.prototype.send = function (message) {
  console.warn('send called');
  this.channel.send(message);
};

freedom().provideAsynchronous(Chat);
