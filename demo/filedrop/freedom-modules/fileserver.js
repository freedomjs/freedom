function FileServer() {
  this.files = {};
}

FileServer.prototype.serve = function(key, value, name) {
  console.log('serve-data: now serving ' + key);
  this.files[key] = {
    data: value,
    stats: {}
  };
  freedom.emit('serve-descriptor', {
    targetId: myClientState.clientId,
    key: key,
    name: name
  });
  this.updateStats(data.key, 0, 0);
};

FileServer.prototype.updateStats = function(key, inprogress, done) {
  if (!this.files[key].stats.hasOwnProperty('inprogress')) {
    this.files[key].stats.inprogress = 0;
  }
  if (!this.files[key].stats.hasOwnProperty('done')) {
    this.files[key].stats.done = 0;
  }
  this.files[key].stats.key = key;
  this.files[key].stats.inprogress += inprogress;
  this.files[key].stats.done += done;
  freedom.emit('stats', this.files[key].stats);
};

FileServer.prototype.onMessage = function(val) {
  
  if (data.from.clientId && msg.cmd && msg.data && msg.cmd == 'fetch') {
    key = msg.data;
    targetId = data.from.clientId;
    fileServer.updateStats(key, 1, 0);

    console.log("social.onMessage: Received request for " + key + " from " + targetId);
    if (files[key] && files[key].data) {
      console.log("social.onMessage: Sending " + key + " to " + targetId);
      social.sendMessage(targetId, 'file', files[key].data).then(function() {
      }, function(err) {
        console.error(JSON.stringify(err));
      });
    } else {
      console.log("social.onMessage: I don't have key: " + key);
      social.sendMessage(targetId, 'protocol', JSON.stringify({
        cmd: 'error',
        data: 'File missing!'
      })).then(function() {
      }, function(err) {
        console.error(JSON.stringify(err));
      });
    }
  } else if (data.from.clientId && msg.cmd && msg.data && msg.cmd == 'done') {
    key = msg.data;
    fileServer.updateStats(key, -1, 1);
  } else {
    console.log("social.onMessage: Unrecognized message: " + JSON.stringify(data));
  }

};
