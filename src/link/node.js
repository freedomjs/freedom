/*globals fdom:true */
/*jslint indent:2, white:true, node:true, sloppy:true */
if (typeof fdom === 'undefined') {
  fdom = {};
}
fdom.link = fdom.link || {};

/**
 * A port providing message transport between two freedom contexts existing in
 * separate Node.js VMs.  Uses node's 'require("vm")' to generate a separate
 * namespace with a shared global object for communication.
 * @class Link.Node
 * @extends Port
 * @uses handleEvents
 * @constructor
 */
fdom.link.Node = function() {
  this.id = 'Link.Node ' + Math.random();
  this.config = {};
  this.src = null;

  fdom.util.handleEvents(this);
};

/**
 * Emit a message from the other end of this port.
 * @method doEmit
 * @param {Event} msg
 * @private
 */
fdom.link.Node.prototype.doEmit = function(msg) {
  if (msg.data.tag === 'control') {
    msg.data.tag = this.controlChannel;
  }
  this.emit(msg.data.tag, msg.data.msg);
};

/**
 * Start this port.
 * @method start
 * @private
 */
fdom.link.Node.prototype.start = function() {
  if (this.config.appContext) {
    console.warn(this.config.global);
    this.obj = this.config.global;
    this.config.global.addEventListener('message', this.doEmit.bind(this) , true);
  } else {
    this.obj = require('webworker-threads').Worker(function() {
      var global = {
        postMessage: postMessage,
        addEventListener: addEventListener,
        close: close
      };
      fdom.setup(global, undefined, {
        isApp: true,
        portType: 'Node'
      });
    });
    this.obj.addEventListener('message', this.doEmit.bind(this) , true);
    this.obj.thread.addEventListener('close', this.stop.bind(this), true);
  }
  this.emit('started');
};

/**
 * Stop this port by deleting the frame.
 * @method stop
 * @private
 */
fdom.link.Node.prototype.stop = function() {
  if (this.obj.thread) {
    this.obj.terminate();
  } else {
    this.config.global.close();
  }
};

/**
 * Get the textual description of this port.
 * @method toString
 * @return {String} the description of this port.
 */
fdom.link.Node.prototype.toString = function() {
  return "[" + this.id + "]";
};

/**
 * Receive messages from the hub to this port.
 * Received messages will be emitted from the other side of the port.
 * @method onMessage
 * @param {String} flow the channel/flow of the message.
 * @param {Object} message The Message.
 */
fdom.link.Node.prototype.onMessage = function(flow, message) {
  if (flow === 'control' && !this.controlChannel) {
    if (!this.controlChannel && message.channel) {
      this.controlChannel = message.channel;
      fdom.util.mixin(this.config, message.config);
      this.start();
    }
  } else {
    if (this.obj) {
      /* //- For Debugging Purposes -
      if (this === this.config.global.directLink) {
        console.warn('->[' + flow + '] ' + JSON.stringify(message));
      } else {
        console.warn('<-[' + flow + '] ' + JSON.stringify(message));
      }
      */
      this.obj.postMessage({tag: flow, msg: message});
    } else {
      this.once('started', this.onMessage.bind(this, flow, message));
    }
  }
};

