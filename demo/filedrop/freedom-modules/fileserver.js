/*jslint sloppy:true*/
/*globals console,freedom*/
function FileServer(inSocial) {
  this.social = inSocial;
  this.files = {};
}

FileServer.prototype.serve = function (myClientState, key, value, name) {
  console.log('serve-data: now serving ' + key);
  this.files[key] = {
    data: value,
    stats: {}
  };
  if (myClientState.status === this.social.STATUS.ONLINE) {
    freedom().emit('serve-descriptor', {
      targetId: myClientState.clientId,
      key: key,
      name: name
    });
  } else {
    freedom().emit('serve-error', "Error connecting to server.");
  }
  this.updateStats(key, 0, 0);
};

FileServer.prototype.updateStats = function (key, inprogress, done) {
  if (!this.files[key].stats.hasOwnProperty('inprogress')) {
    this.files[key].stats.inprogress = 0;
  }
  if (!this.files[key].stats.hasOwnProperty('done')) {
    this.files[key].stats.done = 0;
  }
  this.files[key].stats.key = key;
  this.files[key].stats.inprogress += inprogress;
  this.files[key].stats.done += done;
  freedom().emit('stats', this.files[key].stats);
};

FileServer.prototype.onMessage = function (val) {
  // Try parsing message
  try {
    val.msgStr = this.social.ab2str(val.data);
    val.msg = JSON.parse(val.msgStr);
  } catch (e) {
    console.log("Error parsing message: " + JSON.stringify(val));
    return;
  }
  
  if (val.from.clientId && val.msg.cmd && val.msg.data && val.msg.cmd === 'fetch') {
    var key = val.msg.data,
      targetId = val.from.clientId;
    this.updateStats(key, 1, 0);

    console.log("social.onMessage: Received request for " + key + " from " + targetId);
    if (this.files[key] && this.files[key].data) {
      console.log("social.onMessage: Sending " + key + " to " + targetId);
      this.social.sendMessage(targetId, key, this.files[key].data).then(function () {
      }, function (err) {
        console.error(JSON.stringify(err));
      });
    } else {
      console.log("social.onMessage: I don't have key: " + key);
      this.social.sendMessage(targetId, 's2f', JSON.stringify({
        cmd: 'error',
        data: 'File missing!'
      })).then(function () {
      }, function (err) {
        console.error(JSON.stringify(err));
      });
    }
  } else if (val.from.clientId && val.msg.cmd && val.msg.data && val.msg.cmd === 'done') {
    this.updateStats(val.msg.data, -1, 1);
  } else {
    console.log("social.onMessage: Unrecognized message: " + JSON.stringify(val));
  }

};
