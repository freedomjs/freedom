/**
 * Implementation of a Social provider
 **/

//var WS_URL = 'ws://localhost:8082/route/';
var WS_URL = 'ws://p2pbr.com:8082/route/';

function SocialProvider() {
  this.conn = null;
  this.agent = null;
  this.version = null;
  this.url = null;
  this.id = null;
  //this._sendStatus('offline');  //offline, online, connecting, error
  setTimeout(this._sendStatus.bind(this,'offline'),0);
  this.roster = {};
};

SocialProvider.prototype.login = function(loginOpts, continuation) {
  this.conn = new WebSocket(WS_URL+loginOpts.agent);
  //this.conn = new WebSocket(WS_URL);
  this._sendStatus('connecting');
  this.conn.onopen = (function(msg) {
    this._sendStatus('online');
    this.conn.send(JSON.stringify({}));
  }).bind(this);
  this.conn.onmessage = this._onMessage.bind(this);
  this.conn.onclose = (function (msg) {
    this._sendStatus('offline');
    this.conn = null;
  }).bind(this);
};

SocialProvider.prototype.logout = function(userId, network, cont) {
  this._sendStatus('offline');
  this.conn.close();
  this.conn = null;
  cont({
    userId: this.id,
    success: true,
    message: ''
  });
};

SocialProvider.prototype._sendStatus = function(stat) {
  this.status = stat;
  this.dispatchEvent('onStatus', {
    userId: this.id,
    network: 'websockets',
    status: stat,
    message: 'WS '+stat
  });
};

SocialProvider.prototype._addToRoster = function(id) {
  if (!this.roster[id]){
    var c = {};
    c[id] = {
      clientId: id,
      status: "messageable"
    };
    this.roster[id] = {
      userId: id,
      name: id,
      url: '',
      clients: c
    };
    this.dispatchEvent('onChange', this.roster[id]);
  }
};

SocialProvider.prototype._onMessage = function(msg) {
  msg = JSON.parse(msg.data);
  if (msg.id && msg.from == 0) {
    this.id = msg.id;
    for (var i=0; i<msg.msg.length; i++) {
      this._addToRoster(msg.msg[i]);
    }
    this._sendStatus('online');
  } else if (msg.from && msg.msg) {
    this._addToRoster(msg.from);
    this.dispatchEvent('onMessage', {
      fromUserId: msg.from,
      fromClientId: msg.from,
      toUserId: this.id,
      toClientId: this.id,
      network: 'websockets',
      message: msg.msg
    });
  } else if (msg.from) {
    this._addToRoster(msg.from);
  }
};

//TODO: implement
SocialProvider.prototype.getProfile = function(id, continuation) {
  continuation({});
};

SocialProvider.prototype.sendMessage = function(to, msg, continuation) {
  this.conn.send(JSON.stringify({to: to, msg: msg}));
  continuation();
};

var social = freedom.social();
social.provideAsynchronous(SocialProvider);
