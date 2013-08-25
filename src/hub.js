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

  // TODO: remove debug log once fdom.debug works robustly.
  var debugLog = [];
  if (this.config.global) {
    if (!this.config.global.debugLog) {
      this.config.global.debugLog = [];
    }
    debugLog = this.config.global.debugLog;
  }
  var mlog = this.apps[destination.source].toString() +
              " -" + message.type + "-> " +
              this.apps[destination.app].toString() + "." + destination.flow;
  if (!message.quiet) {
    fdom.debug.log(mlog);
  }
  debugLog.push(mlog);

  this.apps[destination.app].onMessage(destination.flow, message);
};

fdom.Hub.prototype.getDestination = function(source) {
  var destination = this.routes[source];
  return this.apps[destination.app];
};

/**
 * Register a destination for messages with this hub.
 * @method register
 */
fdom.Hub.prototype.register = function(app, force) {
  if (!this.apps[app.id] || force) {
    this.apps[app.id] = app;
    return true;
  } else {
    return false;
  }
};

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

fdom.Hub.prototype.generateRoute = function() {
  return this.route++;
};
