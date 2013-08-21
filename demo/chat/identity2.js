function IdentityProvider() {
  this.conn = new WebSocket("ws://p2pbr.com:8082/route");
  this.connected = false;
  this.conn.addEventListener('open', function() {
    this.connected = true;
  }.bind(this), true);
  this.conn.addEventListener('message', this.onMsg.bind(this), true);
  this.conn.addEventListener('error', function() {
    this.connected = false;
  }.bind(this), true);
  this.conn.addEventListener('close', function() {
    this.connected = false;
  }.bind(this), true);
};

IdentityProvider.prototype.onMsg = function(m) {
  var data = JSON.parse(m.data);
  if (data.from == 0) {
    if (typeof this.id === "function") {
      var c = this.id;
      this.id = data.id;
      c();
    }
    // roster update
    identity.emit('buddylist', data.msg);
  } else {
    identity.emit('message', data);
  }
}

IdentityProvider.prototype.get = function(continuation) {
  var c = function() {continuation({"id": this.id});}.bind(this);
  if (this.id) {
    c();
  } else {
    this.id = c;
  }
};

IdentityProvider.prototype.send = function(to, msg, continuation) {
  this.conn.send(JSON.stringify({to:to, msg:msg}));
  continuation();
};

var identity = freedom.identity();
identity.provideAsynchronous(IdentityProvider);
