/*globals fdom:true, handleEvents, mixin, WebSocket */
/*jslint indent:2, white:true, node:true, sloppy:true, browser:true */
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
  this.socket = null;
  this.status = 'disconnected';  //'disconnected', 'connecting', 'ready'
  handleEvents(this);
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
  }
  if (this.status === 'ready') {
    this.socket.send(JSON.stringify([source, msg]));
  } else {
    this.once('connected', this.onMessage.bind(this, source, msg));
  }
};

fdom.port.Runtime.prototype.connect = function() {
  var host = this.config.runtimeHost || '127.0.0.1',
      port = this.config.runtimePort || 9009;
  if (!this.socket && this.status === 'disconnected') {
    fdom.debug.log("Manager Link connecting");
    this.status = 'connecting';
    this.socket = new WebSocket('ws://' + host + ':' + port);
    this.socket.addEventListener('open', function(msg) {
      fdom.debug.error('Manager link active at ' + window.performance.now());
      fdom.debug.log("Manager Link connected");
      this.status = 'ready';
      this.emit('connected');
      fdom.apis.register('core.runtime', this.runtime.bind(this, this));
    }.bind(this), true);
    this.socket.addEventListener('message', this.message.bind(this), true);
    this.socket.addEventListener('close', function() {
      fdom.debug.log("Manager Link disconnected");
      this.status = 'disconnected';
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
    var iface = Core_unprivileged.bindChannel(this.link, proxy);
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
    console.warn(e.stack);
    fdom.debug.warn('Unable to parse runtime message: ' + msg);
  }
};
