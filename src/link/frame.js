/*jslint indent:2, white:true, node:true, sloppy:true */
/*globals URL,webkitURL */
var Link = require('../link');
var util = require('../util');

/**
 * A port providing message transport between two freedom contexts via iFrames.
 * @class Frame
 * @extends Link
 * @uses handleEvents
 * @constructor
 */
var Frame = function(id, resource) {
  Link.call(this, id, resource);
};

/**
 * Get the document to use for the frame. This allows overrides in downstream
 * links that want to essentially make an iFrame, but need to do it in another
 * context.
 * @method getDocument
 * @protected
 */
Frame.prototype.getDocument = function () {
  this.document = document;
  if (!this.document.body) {
    this.document.appendChild(this.document.createElement("body"));
  }
  this.root = document.body;
};

/**
 * Start this port by listening or creating a frame.
 * @method start
 * @private
 */
Frame.prototype.start = function() {
  if (this.config.moduleContext) {
    this.config.global.DEBUG = true;
    this.setupListener();
    this.src = 'in';
  } else {
    this.setupFrame();
    this.src = 'out';
  }
};

/**
 * Stop this port by deleting the frame.
 * @method stop
 * @private
 */
Frame.prototype.stop = function() {
  // Function is determined by setupListener or setupFrame as appropriate.
};

/**
 * Get the textual description of this port.
 * @method toString
 * @return {String} the description of this port.
 */
Frame.prototype.toString = function() {
  return "[Frame" + this.id + "]";
};

/**
 * Set up a global listener to handle incoming messages to this
 * freedom.js context.
 * @method setupListener
 */
Frame.prototype.setupListener = function() {
  var onMsg = function(msg) {
    if (msg.data.src !== 'in') {
      this.emitMessage(msg.data.flow, msg.data.message);
    }
  }.bind(this);
  this.obj = this.config.global;
  this.obj.addEventListener('message', onMsg, true);
  this.stop = function() {
    this.obj.removeEventListener('message', onMsg, true);
    delete this.obj;
  };
  this.emit('started');
  this.obj.postMessage("Ready For Messages", "*");
};

/**
 * Get a URL of a blob object for inclusion in a frame.
 * Polyfills implementations which don't have a current URL object, like
 * phantomjs.
 * @method getURL
 */
Frame.prototype.getURL = function(blob) {
  if (typeof URL !== 'object' && typeof webkitURL !== 'undefined') {
    return webkitURL.createObjectURL(blob);
  } else {
    return URL.createObjectURL(blob);
  }
};

/**
 * Deallocate the URL of a blob object.
 * Polyfills implementations which don't have a current URL object, like
 * phantomjs.
 * @method getURL
 */
Frame.prototype.revokeURL = function(url) {
  if (typeof URL !== 'object' && typeof webkitURL !== 'undefined') {
    webkitURL.revokeObjectURL(url);
  } else {
    URL.revokeObjectURL(url);
  }
};

/**
 * Set up an iFrame with an isolated freedom.js context inside.
 * @method setupFrame
 */
Frame.prototype.setupFrame = function() {
  var frame, onMsg;
  this.getDocument();
  frame = this.makeFrame(this.config.source, this.config.inject);
  
  this.root.appendChild(frame);

  onMsg = function(frame, msg) {
    if (!this.obj) {
      this.obj = frame;
      this.emit('started');
    }
    if (msg.data.src !== 'out') {
      this.emitMessage(msg.data.flow, msg.data.message);
    }
  }.bind(this, frame.contentWindow);

  frame.contentWindow.addEventListener('message', onMsg, true);
  this.stop = function() {
    frame.contentWindow.removeEventListener('message', onMsg, true);
    if (this.obj) {
      delete this.obj;
    }
    this.revokeURL(frame.src);
    frame.src = "about:blank";
    this.root.removeChild(frame);
  };
};

/**
 * Make frames to replicate freedom isolation without web-workers.
 * iFrame isolation is non-standardized, and access to the DOM within frames
 * means that they are insecure. However, debugging of webworkers is
 * painful enough that this mode of execution can be valuable for debugging.
 * @method makeFrame
 */
Frame.prototype.makeFrame = function(src, inject) {
  // TODO(willscott): add sandboxing protection.
  var frame = this.document.createElement('iframe'),
      extra = '',
      loader,
      blob;

  if (inject) {
    if (!inject.length) {
      inject = [inject];
    }
    inject.forEach(function(script) {
      extra += '<script src="' + script + '" onerror="' +
      'throw new Error(\'Injection of ' + script +' Failed!\');' +
      '"></script>';
    });
  }
  loader = '<html><meta http-equiv="Content-type" content="text/html;' +
    'charset=UTF-8">' + extra + '<script src="' + src + '" onerror="' +
    'throw new Error(\'Loading of ' + src +' Failed!\');' +
    '"></script></html>';
  blob = util.getBlob(loader, 'text/html');
  frame.src = this.getURL(blob);

  return frame;
};

/**
 * Receive messages from the hub to this port.
 * Received messages will be emitted from the other side of the port.
 * @method deliverMessage
 * @param {String} flow the channel/flow of the message.
 * @param {Object} message The Message.
 */
Frame.prototype.deliverMessage = function(flow, message) {
  if (this.obj) {
    //fdom.debug.log('message sent to worker: ', flow, message);
    this.obj.postMessage({
      src: this.src,
      flow: flow,
      message: message
    }, '*');
  } else {
    this.once('started', this.onMessage.bind(this, flow, message));
  }
};

module.exports = Frame;

