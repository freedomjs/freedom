/*jslint indent:2, white:true, node:true, sloppy:true */
var Link = require('../link');
var entry = require('../entry');

/**
 * A port providing message transport between two freedom contexts in the same namespace.
 * Note that using a direct link does not provide the isolation that freedom.js
 * encourages. To that end it should be limited to a method for testing and not
 * used in production without some serious though about the implications of that decision.
 * @class Direct
 * @extends Link
 * @uses handleEvents
 * @constructor
 */
var Direct = function(id, resource) {
  Link.call(this, id, resource);
};

/**
 * Start this port.
 * @method start
 * @private
 */
Direct.prototype.start = function() {
  if (this.config.moduleContext) {
    this.config.global.directLink.other = this;
    this.other = this.config.global.directLink;
    this.other.emit('started');
  } else {
    this.config.global.directLink = this;

    // Keep fdom.debug connected to parent hub.
    var child = entry(undefined, {
      isModule: true,
      portType: 'Direct'
    });
  }
};

/**
 * Stop this port by deleting the frame.
 * @method stop
 * @private
 */
Direct.prototype.stop = function() {
  if (this === this.config.global.directLink) {
    delete this.config.global.directLink;
  }
  delete this.other;
};

/**
 * Get the textual description of this port.
 * @method toString
 * @return {String} the description of this port.
 */
Direct.prototype.toString = function() {
  return "[Direct" + this.id + "]";
};

/**
 * Receive messages from the hub to this port.
 * Received messages will be emitted from the other side of the port.
 * @method deliverMessage
 * @param {String} flow the channel/flow of the message.
 * @param {Object} message The Message.
 */
Direct.prototype.deliverMessage = function(flow, message) {
  if (this.other) {
    /* //- For Debugging Purposes -
    if (this === this.config.global.directLink) {
      console.warn('->[' + flow + '] ' + JSON.stringify(message));
    } else {
      console.warn('<-[' + flow + '] ' + JSON.stringify(message));
    }
    */
    if (flow === 'control') {
      flow = this.other.controlChannel;
    }
    setTimeout(this.other.emit.bind(this.other, flow, message), 0);
  } else {
    this.once('started', this.onMessage.bind(this, flow, message));
  }
};

module.exports = Direct;
