/**
 * A FreeDOM transport provider using WebRTC
 */
var Transport_unprivileged = function(channel) {
  this.nextId = 10;
  this.channel = channel;
  this.rtcConnections = {};
  this.rtcChannels = {};
  this.rtcStates = {};
  handleEvents(this);
};

Transport_unprivileged.prototype.onStateChange = function(id) {
  var sendChannel = this.rtcChannels[id];
  //console.log(id + " send channel's state:"+sendChannel.readyState);
  this.channel.postMessage({
    'action':'event',
    'type': 'onStateChange',
    'value': {'id': id, 'state': sendChannel.readyState}
  });
};

Transport_unprivileged.prototype.onMessage = function(id, evt) {
  var blobber = new Blob([evt.data]);
  console.log("message " + id + " had length " + evt.data.length + " and turned into blob length " + blobber.size);
  
  this.channel.postMessage({
    'action':'event',
    'type': 'onMessage',
    'value': {'header': id, 'data': blobber}
  });
};

Transport_unprivileged.prototype.onIceCandidate = function(id, evt) {
  //console.log(id + " icecandidate: "+JSON.stringify(evt));
  if (evt && evt.candidate) {
    this.channel.postMessage({
      'action': 'event',
      'type': 'onSignal',
      'value': {'id': id, 'message': JSON.stringify(evt)}
    });
  }
}

Transport_unprivileged.prototype['create'] = function (continuation) {
  var sockId = this.nextId++;
  var servers = null;
  var sendChannel;
  var pc = new webkitRTCPeerConnection(servers,
                {'optional': [{'RtpDataChannels': true}]});
  this.rtcConnections[sockId] = pc;
  try {
    sendChannel = pc['createDataChannel']("sendDataChannel", {'reliable': false});
    this.rtcChannels[sockId] = sendChannel;
    sendChannel.onopen = this.onStateChange.bind(this,sockId);
    sendChannel.onclose = this.onStateChange.bind(this,sockId);
    sendChannel.onmessage = this.onMessage.bind(this,sockId);
    pc['onicecandidate'] = this.onIceCandidate.bind(this,sockId);
  
    pc['createOffer'](function(desc) {
      pc['setLocalDescription'](desc);
      continuation({'id': sockId, 'offer': JSON.stringify(desc)});
    });
  } catch (e) {
    console.warn(e.message);
    console.warn('Failed to create data channel. You need Chrome M25' +
                  'or later with --enable-data-channels flag');
    delete this.rtcConnections[sockId];
  }
};

Transport_unprivileged.prototype['accept'] = function (id, strdesc, continuation) {
  var desc = JSON.parse(strdesc);
  if (desc.type == 'icecandidate') {
    /**
    var candidate = new RTCIceCandidate({
      sdpMLineIndex: desc.candidate.sdpMLineIndex,
      sdpMid: desc.candidate.sdpMid,
      candidate: desc.candidate.candidate
    });
    **/
    var candidate = new RTCIceCandidate(desc.candidate);
    if (this.rtcConnections[id] && this.rtcChannels[id].readyState !== "closed") {
      this.rtcConnections[id]['addIceCandidate'](candidate);
      console.log("Successfully accepted ICE candidate");
    }
    continuation();
  //} else if (id == null || !(id in this.rtcConnections)) {
  } else if (desc.type == 'offer') {
    var desc = new RTCSessionDescription(desc);
    var sockId = this.nextId++;
    var servers = null;
    var pc = new webkitRTCPeerConnection(servers, 
                  {'optional': [{'RtpDataChannels': true}]});
    this.rtcConnections[sockId] = pc;
    pc['onicecandidate'] = this.onIceCandidate.bind(this,sockId);
    pc['ondatachannel'] = function(evt) {
      var channel = evt['channel'];
      this.rtcChannels[sockId] = channel;
      channel.onopen = this.onStateChange.bind(this,sockId);
      channel.onclose = this.onStateChange.bind(this,sockId);
      channel.onmessage = this.onMessage.bind(this,sockId);
    }.bind(this);
    //desc, successCallback, failureCallback
    pc['setRemoteDescription'](desc,
      function(){console.log("Successfully set remote description");}, 
      function(){console.log("Failed set remote description");});
    pc['createAnswer'](function(answer) {
      pc['setLocalDescription'](answer);
      continuation({'id': sockId, 'offer': JSON.stringify(answer)});
    });
  } else if (desc.type == 'answer') {
    var desc = new RTCSessionDescription(desc);
    this.rtcConnections[id]['setRemoteDescription'](desc, 
      function(){console.log("Successfully set remote description");}, 
      function(){console.log("Failed set remote description");});
    continuation();
  } else if (desc.type == 'bye') {
    this.close(id);
    continuation();
  }
};

Transport_unprivileged.prototype['send'] = function (msg, continuation) {
  var blob = msg.data;
  var reader = new FileReader();
  reader.onload = function(m, e) {
    console.log("Will Send " + msg.data.size + " which converted to " + e.target.result.length);
    this.rtcChannels[m.header].send(e.target.result);
    continuation();
  }.bind(this, msg);
  reader.onerror = function(e) {
    console.log("Binary translation error!");
    continuation();
  }
  reader.readAsBinaryString(blob);
};

Transport_unprivileged.prototype['close'] = function (id, continuation) {
  this.rtcChannels[id].close();
  this.rtcConnections[id].close();
  //delete this.rtcChannels[id];
  //delete this.rtcConnections[id];
  continuation();
};

/**
Transport_unprivileged.prototype.get = function(key, continuation) {
  try {
    var val = localTransport[this.channel.app.id + key];
    continuation(val);
  } catch(e) {
    continuation(null);
  }
};

Transport_unprivileged.prototype.set = function(key, value, continuation) {
  localTransport[this.channel.app.id + key] = value;
  continuation();
};
**/

fdom.apis.register("core.transport", Transport_unprivileged);
