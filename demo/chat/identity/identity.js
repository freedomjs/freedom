//var WS_URL = 'ws://localhost:8082/route/';
var WS_URL = 'ws://p2pbr.com:8082/route/';

function IdentityProvider() {
  this.conn = null;
  this.agent = null;
  this.version = null;
  this.url = null;
  this.id = null;
  this.status = 'offline'     //offline, online, connecting, error
  this.loginCallback = null;
  this.roster = {};
};

IdentityProvider.prototype.login = function(agent, version, url, continuation) {
  this.conn = new WebSocket(WS_URL+agent);
  //this.conn = new WebSocket(WS_URL);
  this.status = 'connecting';
  //this.dispatchEvent('onStatus', {status: this.status, message: "WS Connecting"});
  this.conn.onopen = (function(msg) {
    this.status = 'online';
    this.conn.send(JSON.stringify({}));
    this.dispatchEvent('onStatus', {status: this.status, message: "WS Connected"});
  }).bind(this);
  this.conn.onmessage = this._onMessage.bind(this);
  this.conn.onclose = (function (msg) {
    this.status = 'offline';
    this.dispatchEvent('onStatus', {status: this.status, message: "WS Disconnected"});
    this.conn = null;
  }).bind(this);
  this.loginCallback = continuation;
};

IdentityProvider.prototype._addToRoster = function(id) {
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

IdentityProvider.prototype._onMessage = function(msg) {
  msg = JSON.parse(msg.data);
  if (msg.id && msg.from == 0) {
    this.id = msg.id;
    for (var i=0; i<msg.msg.length; i++) {
      this._addToRoster(msg.msg[i]);
    }
    this.loginCallback({success: true, userId: msg.id, message: ''});
  } else if (msg.from && msg.msg) {
    this._addToRoster(msg.from);
    this.dispatchEvent('onMessage', {
      fromUserId: msg.from,
      fromClientId: msg.from,
      toUserId: this.id,
      toClientId: this.id,
      message: msg.msg
    });
  } else if (msg.from) {
    this._addToRoster(msg.from);
  }
  /**
  this.dispatchEvent('onChange', {
    userId: asdf,
    name: asdf,
    url: '',
    clients: {
      clientId: asdf,
      status: 'messageable'
    }
  });
  **/
};

//TODO: implement
IdentityProvider.prototype.getProfile = function(id, continuation) {
  continuation();
};

IdentityProvider.prototype.sendMessage = function(to, msg, continuation) {
  this.conn.send(JSON.stringify({to: to, msg: msg}));
  continuation();
};

var identity = freedom.identity();
identity.provideAsynchronous(IdentityProvider);
