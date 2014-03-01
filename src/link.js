/*globals fdom:true */
/*jslint indent:2, white:true, node:true, sloppy:true, browser:true */
if (typeof fdom === 'undefined') {
  fdom = {};
}

/**
 * A link connects two freedom hubs. This is an abstract class
 * providing common functionality of translating control channels,
 * and integrating config information.
 * @class Link
 * @extends Port
 * @constructor
 */
fdom.Link = function() {
  this.id = 'Link' + Math.random();
  this.config = {};
  this.src = null;

  fdom.util.handleEvents(this);
  fdom.util.mixin(this, fdom.Link.prototype);
};

/**
 * Receive messages from the hub to this port.
 * Manages startup, and passes others to 'deliverMessage' implemented
 * in derived classes.
 * @method onMessage
 * @param {String} flow the channel/flow of the message.
 * @param {Object} message The Message.
 */
fdom.Link.prototype.onMessage = function(flow, message) {
  if (flow === 'control' && !this.controlChannel) {
    if (!this.controlChannel && message.channel) {
      this.controlChannel = message.channel;
      fdom.util.mixin(this.config, message.config);
      this.start();
    }
  } else {
    this.deliverMessage(flow, message);
  }
};

/**
 * Emit messages to the the hub, mapping control channels.
 * @method emitMessage
 * @param {String} flow the flow to emit the message on.
 * @param {Object} messgae The message to emit.
 */
fdom.Link.prototype.emitMessage = function(flow, message) {
  if (flow === 'control' && this.controlChannel) {
    flow = this.controlChannel;
  }
  this.emit(flow, message);
};
