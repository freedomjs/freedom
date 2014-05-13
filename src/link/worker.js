/*globals fdom:true, Worker */
/*jslint indent:2, white:true, node:true, sloppy:true, browser:true */
if (typeof fdom === 'undefined') {
  fdom = {};
}
fdom.link = fdom.link || {};

/**
 * A port providing message transport between two freedom contexts via Worker.
 * @class Worker
 * @extends Port
 * @uses handleEvents
 * @constructor
 */
fdom.link.Worker = function(id) {
  if (id) {
    this.manifest = id.substr(id.lastIndexOf('/') + 1);
  }
  fdom.Link.call(this);
};

/**
 * Start this port by listening or creating a worker.
 * @method start
 * @private
 */
fdom.link.Worker.prototype.start = function() {
  if (this.config.moduleContext) {
    this.setupListener();
  } else {
    this.setupWorker();
  }
};

/**
 * Stop this port by destroying the worker.
 * @method stop
 * @private
 */
fdom.link.Worker.prototype.stop = function() {
  // Function is determined by setupListener or setupFrame as appropriate.
};

/**
 * Get the textual description of this port.
 * @method toString
 * @return {String} the description of this port.
 */
fdom.link.Worker.prototype.toString = function() {
  return "[Worker" + this.id + "]";
};

/**
 * Set up a global listener to handle incoming messages to this
 * freedom.js context.
 * @method setupListener
 */
fdom.link.Worker.prototype.setupListener = function() {
  var onMsg = function(msg) {
    this.emitMessage(msg.data.flow, msg.data.message);
  }.bind(this);
  this.obj = this.config.global;
  this.obj.addEventListener('message', onMsg, true);
  this.stop = function() {
    this.obj.removeEventListener('message', onMsg, true);
    delete this.obj;
  };
  this.emit('started');
};

/**
 * Set up a worker with an isolated freedom.js context inside.
 * @method setupWorker
 */
fdom.link.Worker.prototype.setupWorker = function() {
  var worker, blob;
  if (typeof (window.Blob) !== typeof (Function)) {
    worker = new Worker(this.config.source);
  } else {
    blob = new window.Blob([this.config.src], {type: 'text/javascript'});
    worker = new Worker(window.URL.createObjectURL(blob) + '#' + this.manifest);
  }
  worker.addEventListener('error', function(err) {
    fdom.debug.error(err, this.toString());
  }, true);
  worker.addEventListener('message', function(worker, msg) {
    if (!this.obj) {
      this.obj = worker;
      this.emit('started');
    }
    this.emitMessage(msg.data.flow, msg.data.message);
  }.bind(this, worker), true);
  this.stop = function() {
    worker.stop();
    if (this.obj) {
      delete this.obj;
    }
  };
};

/**
 * Receive messages from the hub to this port.
 * Received messages will be emitted from the other side of the port.
 * @method deliverMessage
 * @param {String} flow the channel/flow of the message.
 * @param {Object} message The Message.
 */
fdom.link.Worker.prototype.deliverMessage = function(flow, message) {
  if (flow === 'control' && message.type === 'close' &&
      message.channel === 'control') {
    this.stop();
  } else {
    if (this.obj) {
      //fdom.debug.log('message sent to worker: ', flow, message);
      this.obj.postMessage({
        flow: flow,
        message: message
      });
    } else {
      this.once('started', this.onMessage.bind(this, flow, message));
    }
  }
};

