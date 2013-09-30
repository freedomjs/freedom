/*globals fdom:true, handleEvents, mixin, WebSocket */
/*jslint indent:2, white:true, sloppy:true, browser:true */
if (typeof fdom === 'undefined') {
  fdom = {};
}
fdom.port = fdom.port || {};

/**
 * A client communication port to a priviledged web-server capable
 * remote instance of freedom.js
 * @class Runtime
 * @extends Port
 * @uses handleEvents
 * @constructor
 */
fdom.port.Runtime = function() {
  this.id = 'runtime';
  this.config = {};
  this.runtimes = {};
  this.core = null;
  this.socket = null;
  this.status = fdom.port.Runtime.status.disconnected;
  handleEvents(this);
};

/**
 * Possible states of the Runtime port. Determines where in the
 * setup process the port is.
 * @property status
 * @protected
 * @static
 */
fdom.port.Runtime.status = {
  disconnected: 0,
  connecting: 1,
  connected: 2
};

/**
 * Get the textual description of this port.
 * @method toString
 * @returns {String} The description of this port.
 */
fdom.port.Runtime.prototype.toString = function() {
  return "[Port to Priviledged Runtime]"; 
};

fdom.port.Runtime.prototype.onMessage = function(source, msg) {
  if (source === 'control' && msg.type === 'setup') {
    var config = {};
    mixin(config, msg.config);
    delete config.global;
    //TODO: support long msgs.
    delete config.src;
    msg.config = config;
    this.controlChannel = msg.channel;
    this.connect();
    fdom.apis.getCore('core', this).done(function(core) {
      this.core = core;
    }.bind(this));
  }
  if (this.status === fdom.port.Runtime.status.connected) {
    this.socket.send(JSON.stringify([source, msg]));
  } else {
    this.once('connected', this.onMessage.bind(this, source, msg));
  }
};

fdom.port.Runtime.prototype.connect = function() {
  var host = this.config.runtimeHost || '127.0.0.1',
      port = this.config.runtimePort || 9009;
  if (!this.socket && this.status === fdom.port.Runtime.status.disconnected) {
    fdom.debug.log("Manager Link connecting");
    this.status = fdom.port.Runtime.status.connecting;
    this.socket = new WebSocket('ws://' + host + ':' + port);
    this.socket.addEventListener('open', function(msg) {
      fdom.debug.log("Manager Link connected");
      this.status = fdom.port.Runtime.status.connected;
      this.emit('connected');
      fdom.apis.register('core.runtime', this.runtime.bind(this, this));
    }.bind(this), true);
    this.socket.addEventListener('message', this.message.bind(this), true);
    this.socket.addEventListener('close', function() {
      fdom.debug.log("Manager Link disconnected");
      this.status = fdom.port.Runtime.status.disconnected;
    }.bind(this), true);
  }
};

fdom.port.Runtime.prototype.runtime = function(link, app) {
  this.id = Math.random();
  this.link = link;
  this.app = app;
  this.link.runtimes[this.id] = this;
};

fdom.port.Runtime.prototype.runtime.prototype.createApp = function(manifest, proxy) {
  fdom.resources.get(this.app.manifestId, manifest).done(function(url) {
    this.link.onMessage('runtime', {
      request: 'createApp',
      from: this.app.manifestId,
      to: url,
      id: this.id
    });
    // The created channel gets terminated here, and tunneled through this port.
    var iface = this.link.core.bindChannel(this.link, proxy);
    iface.on(function(flow, msg) {
      this.link.onMessage('runtime', {
        request: 'message',
        id: this.id,
        data: [flow, msg]
      });
      return false;
    }.bind(this));
    this.channel = iface;
  }.bind(this));
};

fdom.port.Runtime.prototype.message = function(msg) {
  try {
    var data = JSON.parse(msg.data);
    // Handle runtime support requests.
    if (data[0] === 'runtime' && data[1].request === 'load') {
      fdom.resources.getContents(data[1].url).done(function(url, from, data) {
        this.onMessage('runtime', {
          response: 'load',
          file: url,
          from: from,
          data: data
        });
      }.bind(this, data[1].url, data[1].from));
      return;
    } else if (data[0] === 'runtime' && data[1].request === 'message') {
      if (!this.runtimes[data[1].id]) {
        fdom.debug.warn('Asked to relay to non-existant runtime:' + data[1].id);
      }
      this.runtimes[data[1].id].channel.emit(data[1].data[0], data[1].data[1]);
    }
    this.emit(data[0], data[1]);
  } catch(e) {
    fdom.debug.warn(e.stack);
    fdom.debug.warn('Unable to parse runtime message: ' + msg);
  }
};
