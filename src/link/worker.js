/*globals Worker */
/*jslint indent:2, white:true, node:true, sloppy:true, browser:true */
var Link = require('../link');
var PromiseCompat = require('es6-promise').Promise;

/**
 * A port providing message transport between two freedom contexts via Worker.
 * @class Worker
 * @extends Link
 * @uses handleEvents
 * @constructor
 */
var WorkerLink = function(id, resource) {
  Link.call(this, id, resource);
  if (id) {
    this.id = id;
  }

  // All messages waiting to be sent, both "flow messages" (sent by the user of
  // this class) and acks.
  this.pendingMessages = [];

  // The number of acks in |this.pendingMessages|.  Always equal to
  // this.pendingMessages.filter(function(msg) { return msg === 'ack'; }).length
  // This value is stored here to avoid that computation.
  this.pendingAcks = 0;

  // This is value is incremented when a new block of messages is received from
  // the other side.  While it is nonzero, all outgoing flow messages will be
  // held in |this.pendingMessages|.  After all the messages have been emitted, an
  // asynchronous task is scheduled to decrement it and send the pending
  // messages if it is zero.  It's possible that another block of messages could
  // arrive during this asynchronous delay, which is why this value cannot be a
  // boolean.
  this.receiveQueuesDraining = 0;

  // The number of flow messages that have been sent but not yet acked.  This
  // does not include the contents of |this.pendingMessages|.
  this.unAckedFlowMessages = 0;
};

/**
 * Handle an incoming message, sent from the other side with |postMessage|.
 * @method onMessageEvent
 * @param {MessageEvent} messageEvent The browser-generated event.  In this
 *     case, the event's data attribute is an array of flow messages and acks.
 * @return {String} the description of this port.
 * @private
 */
WorkerLink.prototype.onMessageEvent = function(messageEvent) {
  ++this.receiveQueuesDraining;
  var messages = messageEvent.data;
  messages.forEach(function(message) {
    if (message === 'ack') {
      --this.unAckedFlowMessages;
      return;
    }
    this.emitMessage(message.flow, message.message);
    this.pendingMessages.push('ack');
    this.pendingAcks++;
  }.bind(this));

  // This is intended to allow the 'ack' for a function call to be
  // batched with the return value if the function returns immediately, even
  // for a promise provider.  This only works if |this.emitMessage| runs the
  // function synchronously, Promises resolve in order, and there is at most
  // one Promise in the function call codepath.
  PromiseCompat.resolve().then(function() {
    --this.receiveQueuesDraining;
    this.maybeSendPendingMessages();
  }.bind(this));
};

/**
 * Start this port by listening or creating a worker.
 * @method start
 * @private
 */
WorkerLink.prototype.start = function() {
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
WorkerLink.prototype.stop = function() {
  // Function is determined by setupListener or setupFrame as appropriate.
};

/**
 * Get the textual description of this port.
 * @method toString
 * @return {String} the description of this port.
 */
WorkerLink.prototype.toString = function() {
  return "[Worker " + this.id + "]";
};

/**
 * Set up a global listener to handle incoming messages to this
 * freedom.js context.
 * @method setupListener
 */
WorkerLink.prototype.setupListener = function() {
  var onMsg = this.onMessageEvent.bind(this);
  this.obj = this.config.global;
  this.obj.addEventListener('message', onMsg, true);
  this.stop = function() {
    this.obj.removeEventListener('message', onMsg, true);
    delete this.obj;
  };
  this.emit('started');
  this.obj.postMessage("Ready For Messages");
};

/**
 * Set up a worker with an isolated freedom.js context inside.
 * @method setupWorker
 */
WorkerLink.prototype.setupWorker = function() {
  var worker,
    blob,
    self = this;
  worker = new Worker(this.config.source + '#' + this.id);

  worker.addEventListener('error', function(err) {
    this.onError(err);
  }.bind(this), true);
  worker.addEventListener('message', function(worker, msg) {
    if (!this.obj) {
      this.obj = worker;
      this.emit('started');
      return;
    }
    this.onMessageEvent(msg);
  }.bind(this, worker), true);
  this.stop = function() {
    worker.terminate();
    if (this.obj) {
      delete this.obj;
    }
  };
};

/**
 * Sends the contents of |this.pendingMessages|, or waits to accumulate a
 * larger batch.
 * @method maybeSendPendingMessages
 * @private
 */
WorkerLink.prototype.maybeSendPendingMessages = function() {
  if (this.receiveQueuesDraining > 0 ||
      this.pendingMessages.length === 0) {
    return;
  }

  if (this.pendingAcks === 0 && this.unAckedFlowMessages > 0) {
    // We're not acking any events, so wait to hear back about
    // the outstanding events.
    return;
  }

  var pendingFlowMessages = this.pendingMessages.length - this.pendingAcks;
  this.obj.postMessage(this.pendingMessages);
  this.unAckedFlowMessages += pendingFlowMessages;
  this.pendingMessages = [];
  this.pendingAcks = 0;
};

/**
 * Receive messages from the hub to this port.
 * Received messages will be emitted from the other side of the port.
 * @method deliverMessage
 * @param {String} flow the channel/flow of the message.
 * @param {Object} message The Message.
 */
WorkerLink.prototype.deliverMessage = function(flow, message) {
  if (flow === 'control' && message.type === 'close' &&
      message.channel === 'control') {
    this.stop();
  } else {
    if (this.obj) {
      this.pendingMessages.push({
        flow: flow,
        message: message
      });
      this.maybeSendPendingMessages();
    } else {
      this.once('started', this.onMessage.bind(this, flow, message));
    }
  }
};

module.exports = WorkerLink;

