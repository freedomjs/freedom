/*globals fdom:true, handleEvents, mixin, eachProp, XMLHttpRequest, makeAbsolute */
/*jslint indent:2,white:true,node:true,sloppy:true */
if (typeof fdom === 'undefined') {
  fdom = {};
}

/**
 * Defines fdom.Hub, the core message hub between freedom modules.
 * Incomming messages from apps are sent to hub.onMessage()
 * @class Hub
 * @constructor
 */
fdom.Hub = function() {
  this.route = Math.round(Math.random() * 1000000);
  this.config = {};
  this.apps = {};
  this.routes = {};
  this.unbound = [];

  handleEvents(this);
  this.on('config', function(config) {
    mixin(this.config, config);
  }.bind(this));
};

/**
 * Handle an incoming message from a freedom app.
 * @method onMessage
 * @param {String} source The identifiying source of the message.
 * @param {Object} message The sent message.
 */
fdom.Hub.prototype.onMessage = function(source, message) {
  if (!this.routes[source]) {
    fdom.debug.warn("Message dropped from unregistered source " + source);
    return;
  }

  var destination = this.routes[source];
  if (!destination.app) {
    fdom.debug.warn("Message dropped from unconfigured source " + source);
    return;
  }

  if (!message.quiet) {
    fdom.debug.log(this.apps[destination.source].toString() +
        " -" + message.type + "-> " +
        this.apps[destination.app].toString() + "." + destination.flow);
  }

  this.apps[destination.app].onMessage(destination.flow, message);
};

/**
 * Get the local destination port of a flow.
 * @method getDestination
 * @param {String} source The flow to retrieve.
 * @return {Port} The destination port.
 */
fdom.Hub.prototype.getDestination = function(source) {
  var destination = this.routes[source];
  return this.apps[destination.app];
};

/**
 * Register a destination for messages with this hub.
 * @method register
 * @param {Port} app The Port to register.
 * @param {Boolean} [force] Whether to override an existing port.
 * @return {Boolean} Whether the app was registered.
 */
fdom.Hub.prototype.register = function(app, force) {
  if (!this.apps[app.id] || force) {
    this.apps[app.id] = app;
    return true;
  } else {
    return false;
  }
};

/**
 * Install a new route in the hub.
 * @method install
 * @param {Port} source The source of the route.
 * @param {Port} destination The destination of the route.
 * @param {String} The flow on which the destination will receive routed messages.
 * @return {String} A routing source identifier for sending messages.
 */
fdom.Hub.prototype.install = function(source, destination, flow) {
  if (!this.apps[source.id]) {
    console.warn("Unwilling to generate a source for " + source.id);
    return;
  }
  if (!destination) {
    console.warn("Unwilling to generate a flow to nowhere from " + source.id);
    return;
  }

  var route = this.generateRoute();
  this.routes[route] = {
    app: destination,
    flow: flow,
    source: source.id
  };
  if (typeof source.on === 'function') {
    source.on(route, this.onMessage.bind(this, route));
  }

  return route;
};

/**
 * Generate a unique routing identifier.
 * @method generateRoute
 * @return {String} a routing source identifier.
 * @private
 */
fdom.Hub.prototype.generateRoute = function() {
  return (this.route += 1);
};
