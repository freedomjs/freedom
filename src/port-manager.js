/*globals fdom:true, handleEvents, mixin, XMLHttpRequest */
/*jslint indent:2,white:true,node:true,sloppy:true */
if (typeof fdom === 'undefined') {
  fdom = {};
}
fdom.port = fdom.port || {};

/**
 * A freedom application which processes control messages to create other
 * application instances.
 * @class App.Manager
 * @extends App
 * @constructor
 */
fdom.port.Manager = function(hub) {
  this.id = 'control';
  this.config = {};
  this.flows = {};
  this.hub = hub;
  
  this.hub.on('config', function(config) {
    mixin(this.config, config);
  }.bind(this));
  
  handleEvents(this);
  this.hub.register(this);
};

/**
 * Receive a message from the freedom hub.
 */
fdom.port.Manager.prototype.onMessage = function(flow, message) {
  var reverseFlow = this.flows[flow], origin;
  if (!reverseFlow) {
    console.warn("Unknown message source: " + flow);
    return;
  }
  origin = this.hub.getDestination(reverseFlow);
  
  if (message.request !== 'debug') {
    // TODO(willscott): Control Debug levels.
    console.log(message);
    console.log(origin.id + " -C " + message.request);
  } else if (this.config.debug && message.request === 'debug') {
    console.log(origin.id + " -D " + message.msg);
  }

  if (message.request === 'link') {
    this.createLink(origin, message.name, message.to);
  } else if (message.request === 'create') {
    console.log('setting up ' + origin.id);
    this.setup(origin);
  } else {
    console.warn("Unknown control request: " + message.request);
    return;
  }
};

fdom.port.Manager.prototype.setup = function(port) {
  if (!port.id) {
    console.warn("Refusing to setup unidentified port ");
    return;
  }

  if(this.flows[port.id]) {
    console.warn("Refusing to re-initialize port " + port.id);
    return;
  }
  this.hub.register(port);
  var flow = this.hub.install(this, port.id, "control"),
      reverse = this.hub.install(port, this.id, port.id);
  this.flows[port.id] = flow;

  this.hub.onMessage(flow, {
    channel: reverse,
    config: this.config
  });
};

fdom.port.Manager.prototype.createLink = function(port, name, destination) {
  if (!this.flows[destination.id]) {
    this.setup(destination);
  }
  var outgoing = this.hub.install(port, destination.id, 'default'),
      reverse = this.hub.install(destination, port.id, name);

  this.hub.onMessage(this.flows[port.id], {
    name: name,
    channel: outgoing,
    reverse: reverse
  });
};
