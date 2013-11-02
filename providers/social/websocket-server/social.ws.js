/**
 * Implementation of a Social provider that depends on
 * the WebSockets server code in server/router.py
 * The current implementation uses a public facing common server
 * hosted on p2pbr.com
 *
 * The provider offers
 * - A single global buddylist that everyone is on
 * - no reliability
 * - out of order delivery
 * - ephemeral userIds and clientIds
 **/

var social = freedom.social();
//var WS_URL = 'ws://localhost:8082/route/';
var WS_URL = 'ws://p2pbr.com:8082/route/';
var NETWORK_ID = 'websockets';

function SocialProvider() {
  console.log("WS Social Provider at " + self.location.href);
  this.conn = null;
  this.id = null;
  this.roster = {};
  setTimeout(this._sendStatus.bind(this,'OFFLINE', 'offline'),0);
};

SocialProvider.prototype.login = function(loginOpts, continuation) {
  this.conn = new WebSocket(WS_URL+loginOpts.agent);
  this._sendStatus('CONNECTING', 'connecting');
  this.conn.onmessage = this._onMessage.bind(this);
  this.conn.onopen = (function(cont, msg) {
    this.conn.send(JSON.stringify({}));
    cont(this._sendStatus('ONLINE', 'online'));
  }).bind(this, continuation);
  this.conn.onerror = (function (cont, error) {
    this.conn = null;
    cont(this._sendStatus('ERR_CONNECTION', error));
  }).bind(this, continuation);
  this.conn.onclose = (function (cont, msg) {
    this.conn = null;
    cont(this._sendStatus('OFFLINE', 'offline'));
  }).bind(this, continuation);
};

//TODO: implement
SocialProvider.prototype.getRoster = function(continuation) {
  continuation(this.roster);
};

SocialProvider.prototype.sendMessage = function(to, msg, continuation) {
  this.conn.send(JSON.stringify({to: to, msg: msg}));
  continuation();
};

SocialProvider.prototype.logout = function(logoutOpts, continuation) {
  this.conn.close();
  this.conn = null;
  continuation(this._sendStatus('OFFLINE', 'offline'));
};

/**
 * INTERNAL METHODS
 **/

SocialProvider.prototype._sendStatus = function(stat, message) {
  //@TODO CHANGE STATUS TO USE STATUS_CODES
  var result = {
    network: NETWORK_ID,
    userId: this.id,
    status: stat,
    message: message
  };
  this.dispatchEvent('onStatus', result);
  return result;
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
      clients: c
    };
    this.dispatchEvent('onChange', this.roster[id]);
  }
};

SocialProvider.prototype._onMessage = function(msg) {
  msg = JSON.parse(msg.data);
  if (msg.id && msg.from == 0) {
    this.id = msg.id;
    this._addToRoster(this.id);
    for (var i=0; i<msg.msg.length; i++) {
      this._addToRoster(msg.msg[i]);
    }
    this._sendStatus('ONLINE', 'online');
  } else if (msg.from && msg.msg) {
    this._addToRoster(msg.from);
    this.dispatchEvent('onMessage', {
      fromUserId: msg.from,
      fromClientId: msg.from,
      toUserId: this.id,
      toClientId: this.id,
      network: NETWORK_ID,
      message: msg.msg
    });
  } else if (msg.from) {
    this._addToRoster(msg.from);
  }
};

social.provideAsynchronous(SocialProvider);
