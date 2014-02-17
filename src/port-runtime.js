/*globals fdom:true, WebSocket */
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
  fdom.util.handleEvents(this);
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


/**
 * Handle a message from the local freedom environment.
 * The runtime port will strip off the recursive config sent at setup,
 * but otherwise sends messages un-altered.
 * @method onMessage
 * @param {String} source The source of the message
 * @param {Object} msg The message to send.
 */
fdom.port.Runtime.prototype.onMessage = function(source, msg) {
  if (source === 'control' && msg.type === 'setup') {
    var config = {};
    fdom.util.mixin(config, msg.config);
    delete config.global;
    //TODO: support long msgs.
    delete config.src;
    msg.config = config;
    this.controlChannel = msg.channel;
    this.connect();
    this.emit(this.controlChannel, {
      type: 'Get Core Provider',
      request: 'core'
    });
  } else if (source === 'control' && msg.type === 'core' && !this.core) {
    this.core = msg.core;
  }
  if (this.status === fdom.port.Runtime.status.connected) {
    this.socket.send(JSON.stringify([source, msg]));
  } else {
    this.once('connected', this.onMessage.bind(this, source, msg));
  }
};

/**
 * Attempt to connect to the runtime server.
 * Address / Port to connect to default to 127.0.0.1:9009, but can be overridden
 * by setting 'runtimeHost' and 'runtimePort' configuration options.
 * @method connect
 * @protected
 */
fdom.port.Runtime.prototype.connect = function() {
  var host = this.config.runtimeHost || '127.0.0.1',
      port = this.config.runtimePort || 9009;
  if (!this.socket && this.status === fdom.port.Runtime.status.disconnected) {
    fdom.debug.log("FreeDOM Runtime Link connecting");
    this.status = fdom.port.Runtime.status.connecting;
    this.socket = new WebSocket('ws://' + host + ':' + port);
    this.socket.addEventListener('open', function(msg) {
      fdom.debug.log("FreeDOM Runtime Link connected");
      this.status = fdom.port.Runtime.status.connected;
      this.emit('connected');
      fdom.apis.register('core.runtime', this.runtime.bind(this, this));
    }.bind(this), true);
    this.socket.addEventListener('message', this.message.bind(this), true);
    this.socket.addEventListener('close', function() {
      fdom.debug.log("FreeDOM Runtime Link disconnected");
      this.status = fdom.port.Runtime.status.disconnected;
    }.bind(this), true);
  }
};

/**
 * Process a message from the freedom.js runtime.
 * Currently, the runtime intercepts two types of messages internally:
 * 1. runtime.load messages are immediately resolved to see if the local context
 * can load the contents of a file, since the remote server may have cross origin
 * issues reading a file, or the file may only exist locally.
 * 2. runtime.message messages are delivered to the appropriate instantiatiation of
 * a Runtime.Runtime provider, for the core.runtime API.
 * Other messages are emitted normally.
 * @param {Object} msg The message to process.
 * @protected
 */
fdom.port.Runtime.prototype.message = function(msg) {
  try {
    var data = JSON.parse(msg.data);
    // Handle runtime support requests.
    if (data[0] === 'runtime' && data[1].request === 'load') {
      fdom.resources.getContents(data[1].url).then(function(url, from, data) {
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

/**
 * A Runtime, backing the 'core.runtime' API.
 * The runtime object handles requests by local applications wanting to
 * interact with the freedom.js runtime. Primarily, this is done by
 * using 'createApp' to connect with a remote application.
 * @class Runtime.Runtime
 * @constructor
 * @param {Runtime} link The runtime port associated with this provider.
 * @param {App} app The app creating this provider.
 */
fdom.port.Runtime.prototype.runtime = function(link, app) {
  this.id = Math.random();
  this.link = link;
  this.app = app;
  this.link.runtimes[this.id] = this;
};

/**
 * Create a remote App with a specified manifest.
 * TODO(willscott): This should probably be refactored to 'connectApp',
 *     Since there shouldn't be a distinction between creation and re-connection.
 *     Additionally, the Final API for core.runtime remains undetermined.
 * @method createApp
 * @param {String} manifest The app to start.
 * @param {Object} proxy The identifier of the communication channel to use
 * to talk with the created app.
 */
fdom.port.Runtime.prototype.runtime.prototype.createApp = function(manifest, proxy) {
  fdom.resources.get(this.app.manifestId, manifest).then(function(url) {
    this.link.onMessage('runtime', {
      request: 'createApp',
      from: this.app.manifestId,
      to: url,
      id: this.id
    });
    // The created channel gets terminated with the runtime port.
    // Messages are then tunneled to the runtime.
    // Messages from the runtime are delivered in Runtime.message.
    this.link.core.bindChannel(proxy).then(function(iface) {
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
  }.bind(this));
};
