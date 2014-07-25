function FileFetcher(inSocial) {
  this.social = inSocial;
  this.fetchQueue = [];

}

FileFetcher.prototype.download = function(data) {
  if (myClientState !== null && 
      myClientState.status == social.STATUS["ONLINE"]) {
    fetch(data);
  } else {
    queuedFetch = data;
  }
};

FileFetcher.prototype.tryFetch = function(data) {
  //@todo smarter way to choose a target in the future
  var serverId = data.targetId;
  var key = data.key;
  
  console.log("fetch: downloading " + key + " from " + serverId);
  //Tell 'em I'm comin' for them
  social.sendMessage(serverId, 'protocol', JSON.stringify({
    cmd: 'fetch',
    data: key
  })).then(function() {
  }, function(err) {
    console.error(JSON.stringify(err));
  });
};

FileFetcher.prototype.onMessage = function() {
  var msg;
  var targetId;
  var key;

  if (data.tag == 'file') {
    console.log("Received data with tag: " + data.tag);
    social.sendMessage(data.from.clientId, 'protocol', JSON.stringify({
      cmd: 'done',
      data: queuedFetch.key 
    })).then(function() {
    }, function(err) {
      console.error(JSON.stringify(err));
    });
    freedom.emit('download-data', data.data);
    return;
  }

  // Try parsing message
  try {
    data.message = social._ab2str(data.data);
    msg = JSON.parse(data.message);
  } catch (e) {
    console.log("Error parsing message: " + data);
    return;
  }
  
  if (data.from.clientId && msg.cmd && msg.data && msg.cmd == 'error') {
    console.log('social.onMessage: ' + msg.data);
    freedom.emit('download-error', msg.data);
  } else {
    console.log("social.onMessage: Unrecognized message: " + JSON.stringify(data));
  }

};

FileFetcher.prototype.onClientState = function(data) {
  
  if (data.status == social.STATUS["ONLINE"] && 
    queuedFetch !== null && data.clientId == queuedFetch.targetId) {
    fetch(queuedFetch);
    //setTimeout(fetch.bind({},queuedFetch),10000);
  }


};
