if (typeof fdom === 'undefined') {
  fdom = {};
}

fdom.ManagerLink = function() {
  this.config = {};
  this.socket = null;
  this.status = 'disconnected';  //'disconnected', 'connecting', 'ready'
};

fdom.ManagerLink.get = function() {
  if (!fdom.ManagerLink._managerlink) {
    fdom.ManagerLink._managerlink = new fdom.ManagerLink();
  }
  return fdom.ManagerLink._managerlink;
};

fdom.ManagerLink.prototype.connect = function() {
  if (!this.socket && this.status == 'disconnected') {
    console.log("Manager Link connecting");
    this.status = 'connecting';
    this.socket = new WebSocket('ws://127.0.0.1:9009');
    this.socket.onopen = (function(msg){
      console.log("Manager Link ready");
      this.status = 'ready';
      this.socket.send("HIHIHIHI");
    }).bind(this);
    this.socket.onmessage = function(msg){console.log(msg);};
    this.socket.onclose = (function(msg){
      console.log("Manager Link disconnected");
      this.status = 'disconnected';
    }).bind(this);

  //var xhr = new XMLHttpRequest();
  //xhr.onload = this.receiveScript.bind(this);
  //xhr.open('get', 'http://127.0.0.1:9009/script', true);
  //xhr.send();
  }
};

fdom.ManagerLink.prototype.disconnect = function() {
  console.log("Manager link closing");
  this.socket.close();
  this.socket = null;
};

