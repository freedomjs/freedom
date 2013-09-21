if (typeof fdom === 'undefined') {
  fdom = {};
}

fdom.ManagerLink = function() {
  this.id = 'runtime';
  this.config = {};
  this.socket = null;
  this.status = 'disconnected';  //'disconnected', 'connecting', 'ready'
  handleEvents(this);

  this.connect();
};

fdom.ManagerLink.prototype.toString = function() {
  return "[WebSocket to Local Manager]"; 
};

fdom.ManagerLink.prototype.onMessage = function(source, msg) {
  if (source === 'control' && msg.type === 'setup') {
    delete msg.config.global;
    //TODO: support long msgs.
    delete msg.config.src;
  }
  if (this.status == 'ready') {
    console.log('about to send message ', msg);
    this.socket.send(JSON.stringify([source, msg]));
  } else {
    this.once('connected', this.onMessage.bind(this, source, msg));
  }
};

fdom.ManagerLink.prototype.connect = function() {
  if (!this.socket && this.status == 'disconnected') {
    fdom.debug.log("Manager Link connecting");
    this.status = 'connecting';
    this.socket = new WebSocket('ws://127.0.0.1:9009');
    this.socket.addEventListener('open', function(msg) {
      fdom.debug.log("Manager Link connected");
      this.status = 'ready';
      this.emit('connected');
    }.bind(this), true);
    this.socket.addEventListener('message', this.message.bind(this), true);
    this.socket.addEventListener('close', function() {
      fdom.debug.log("Manager Link disconnected");
      this.status = 'disconnected';
    }.bind(this), true);
  }
};

fdom.ManagerLink.prototype.message = function(msg) {
  try {
    console.log('incoming message: ', msg.data);
    var data = JSON.parse(msg.data);
    // Handle runtime support requests.
    if (data[0] === 'runtime' && data[1].request === 'load') {
      var file = resolvePath(data[1].url, data[1].from);
      Util.loadFile(file, function(data) {
        this.onMessage('runtime', {
          response: 'load',
          file: file,
          data: data
        });
      }.bind(this));
      return;
    }
    this.emit(data[0], data[1]);
  } catch(e) {
    fdom.debug.warn('Unable to parse runtime message: ' + msg);
  }
};
