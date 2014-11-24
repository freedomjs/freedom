/*jslint sloppy:true*/
/*globals freedom,console*/
function FileFetcher(inSocial) {
  freedom.core().getLogger('[File Fetcher]').then(function (log) {
    this.logger = log;
  }.bind(this));
  this.social = inSocial;
  this.queuedFetch = null;
}

FileFetcher.prototype.download = function (data) {
  this.queuedFetch = data;
};

FileFetcher.prototype.tryFetch = function (data) {
  //@todo smarter way to choose a target in the future
  var serverId = data.targetId,
    key = data.key;
  
  this.logger.log("fetch: downloading " + key + " from " + serverId);
  //Tell 'em I'm comin' for them
  this.social.sendMessage(serverId, 'f2s', JSON.stringify({
    cmd: 'fetch',
    data: key
  })).then(function () {
  }, function (err) {
    this.logger.error(JSON.stringify(err));
  }.bind(this));
};

FileFetcher.prototype.onClientState = function (val) {
  if (val.status === this.social.STATUS.ONLINE &&
      this.queuedFetch !== null &&
      val.clientId === this.queuedFetch.targetId) {
    this.tryFetch(this.queuedFetch);
    this.queuedFetch = null;
  }
};

FileFetcher.prototype.onMessage = function (val) {
  if (val.tag !== 's2f') {
    this.logger.log("Received data with tag: " + val.tag);
    this.social.sendMessage(val.from.clientId, 'f2s', JSON.stringify({
      cmd: 'done',
      data: val.tag
    })).then(function () {
    }, function (err) {
      this.logger.error(JSON.stringify(err));
    }.bind(this));
    freedom().emit('download-data', val.data);
    return;
  }

  // Try parsing message
  try {
    val.msgStr = this.social.ab2str(val.data);
    val.msg = JSON.parse(val.msgStr);
  } catch (e) {
    this.logger.log("Error parsing message: " + JSON.stringify(val));
    return;
  }
  
  if (val.from.clientId && val.msg.cmd && val.msg.data && val.msg.cmd === 'error') {
    this.logger.log('social.onMessage: ' + val.msg.data);
    freedom().emit('download-error', val.msg.data);
  } else {
    this.logger.log("social.onMessage: Unrecognized message: " + JSON.stringify(val));
  }

};


