var WS_URL = 'ws://localhost.com:8082/route';

function IdentityProvider() {
  this.conn = null;
  this.agent = null;
  this.version = null;
  this.url = null;
  this.status = 'offline'     //offline, online, connecting, error
  this.loginCallback = null;
};

IdentityProvider.prototype.login = function(agent, version, url, continuation) {
  //this.conn = new WebSocket(WS_URL+'/'+agent);
  this.conn = new WebSocket(WS_URL);
  this.status = 'connecting';
  //this.dispatchEvent('onStatus', {status: this.status, message: "WS Connecting"});
  this.conn.onopen = (function(msg) {
    this.status = 'online';
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

IdentityProvider.prototype._onMessage = function(msg) {
  console.log(JSON.stringify(msg));
  if (msg['id'] && msg['from'] && msg['from'] == 0) {
    console.log(JSON.stringify(msg['msg']));
    this.loginContinuation({success: true, userId: msg['id'], message: ''});
  } else if (msg['from']) {
    console.log(JSON.stringify(msg['msg']));

  }
  /**
  this.dispatchEvent('onMessage', {
    fromUserId: asdf,
    fromClientId: adsf,
    toUserId: asdf,
    toClientId: asdf,
    message: asdf
  });

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

IdentityProvider.prototype.getProfile = function(id, continuation) {

};

IdentityProvider.prototype.sendMessage = function(to, msg, continuation) {
  //var params = "prefix=nop&cmd=send&uid=" + this.name + "&to=" + to + "&msg=" + msg;
  //sendPost(to, this.name, msg);
  //this.view.postMessage({setUrl: rendezvousUrl});
  //this.view.postMessage({cmd: 'send', uid: this.name, to: to, msg: msg});
  continuation();
};

var identity = freedom.identity();
identity.provideAsynchronous(IdentityProvider);
