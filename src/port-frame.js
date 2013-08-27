/*globals fdom:true, handleEvents, mixin, isAppContext, getBlob, forceAppContext, getURL */
/*jslint indent:2, white:true, node:true, sloppy:true, browser:true */
if (typeof fdom === 'undefined') {
  fdom = {};
}
fdom.port = fdom.port || {};

/**
 * A port providing message transport between two freedom contexts via iFrames.
 * @class Frame
 * @extends Port
 * @uses handleEvents
 * @constructor
 */
fdom.port.Frame = function() {
  this.id = 'Frame ' + Math.random();
  this.config = {};

  handleEvents(this);
};

/**
 * Start this port by listening or creating a frame.
 * @method start
 * @private
 */
fdom.port.Frame.prototype.start = function() {
  if (isAppContext()) {
    this.setupListener();
  } else {
    this.setupFrame();
  }
};

/**
 * Get the textual description of this port.
 * @method toString
 * @return {String} the description of this port.
 */
fdom.port.Frame.prototype.toString = function() {
  return "[" + this.id + "]";
};

/**
 * Set up a global listener to handle incoming messages to this
 * freedom.js context.
 * @method setupListener
 */
fdom.port.Frame.prototype.setupListener = function() {
  this.obj = this.config.global;
  this.config.global.addEventListener('message', function(msg) {
    this.emitMessage(msg.data.flow, msg.data.message);
  }.bind(this), true);
  this.emit('started');
};

/**
 * Emit messages to the the hub, mapping control channels.
 * @method emitMessage
 * @param {String} flow the flow to emit the message on.
 * @param {Object} messgae The message to emit.
 */
fdom.port.Frame.prototype.emitMessage = function(flow, message) {
  if (flow === 'control' && this.controlChannel) {
    flow = this.controlChannel;
  }
  this.emit(flow, message);
};

/**
 * Set up an iFrame with an isolated freedom.js context inside.
 * @method setupWorker
 */
fdom.port.Frame.prototype.setupFrame = function() {
  var frame;
  frame = this.makeFrame(this.config.src, this.config.inject);
  frame.addEventListener('message', function(frame, msg) {
    if (!this.obj) {
      this.obj = frame;
      this.emit('started');
    }
    this.emitMessage(msg.data.flow, msg.data.message);
  }.bind(this, frame), true);
};

/**
 * Make frames to replicate freedom isolation without web-workers.
 * iFrame isolation is non-standardized, and access to the DOM within frames
 * means that they are insecure. However, debugging of webworkers is
 * painful enough that this mode of execution can be valuable for debugging.
 * @method makeFrame
 */
fdom.port.Frame.prototype.makeFrame = function(src, inject) {
  var frame = document.createElement('iframe'),
      extra = '',
      loader,
      blob;
  // TODO(willscott): add sandboxing protection.

  // TODO(willscott): survive name mangling.
  src = src.replace("'portType': 'Worker'", "'portType': 'Frame'");
  if (inject) {
    extra = '<script src="' + inject + '"></script>';
  }
  loader = '<html>' + extra + '<script src="' +
      forceAppContext(src) + '"></script></html>';
  blob = getBlob(loader, 'text/html');
  frame.src = getURL(blob);

  if (!document.body) {
    document.appendChild(document.createElement("body"));
  }
  document.body.appendChild(frame);
  return frame.contentWindow;
};

/**
 * Receive messages from the hub to this port.
 * Received messages will be emitted from the other side of the port.
 * @method onMessage
 * @param {String} flow the channel/flow of the message.
 * @param {Object} message The Message.
 */
fdom.port.Frame.prototype.onMessage = function(flow, message) {
  if (flow === 'control' && !this.controlChannel) {
    if (!this.controlChannel && message.channel) {
      this.controlChannel = message.channel;
      mixin(this.config, message.config);
      this.start();
    }
  } else {
    if (this.obj) {
      //fdom.debug.log('message sent to worker: ', flow, message);
      this.obj.postMessage({
        flow: flow,
        message: message
      }, '*');
    } else {
      this.once('started', this.onMessage.bind(this, flow, message));
    }
  }
};

