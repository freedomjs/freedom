/*globals fdom:true */
/*jslint indent:2,white:true,node:true,sloppy:true */
if (typeof fdom === 'undefined') {
  fdom = {};
}
fdom.port = fdom.port || {};

/**
 * A freedom port which manages the control plane of of changing hub routes.
 * @class Manager
 * @extends Port
 * @param {Hub} hub The routing hub to control.
 * @constructor
 */
fdom.port.Manager = function(hub) {
  this.id = 'control';
  this.config = {};
  this.controlFlows = {};
  this.dataFlows = {};
  this.dataFlows[this.id] = [];
  this.reverseFlowMap = {};
  this.hub = hub;
  this.delegate = null;
  this.toDelegate = {};
  
  this.hub.on('config', function(config) {
    fdom.util.mixin(this.config, config);
    this.emit('config');
  }.bind(this));
  
  fdom.util.handleEvents(this);
  this.hub.register(this);
};

/**
 * Provide a textual description of this port.
 * @method toString
 * @return {String} the description of this port.
 */
fdom.port.Manager.prototype.toString = function() {
  return "[Local Controller]";
};

/**
 * Process messages sent to this port.
 * The manager, or 'control' destination handles several types of messages,
 * identified by the request property.  The actions are:
 * 1. debug. Prints the message to the console.
 * 2. link. Creates a link between the source and a provided destination port.
 * 3. port. Creates a link between the source and a described port type.
 * 4. delegate. Routes a defined set of control messages to another location.
 * 5. resource. Registers the source as a resource resolver.
 * 6. core. Generates a core provider for the requester.
 * 7. close. Tears down routes involing the requesting port.
 * 8. unlink. Tears down a route from the requesting port.
 * @method onMessage
 * @param {String} flow The source identifier of the message.
 * @param {Object} message The received message.
 */
fdom.port.Manager.prototype.onMessage = function(flow, message) {
  var reverseFlow = this.controlFlows[flow], origin;
  if (!reverseFlow) {
    fdom.debug.warn("Unknown message source: " + flow);
    return;
  }
  origin = this.hub.getDestination(reverseFlow);

  if (this.delegate && reverseFlow !== this.delegate && this.toDelegate[flow]) {
    // Ship off to the delegee
    this.emit(this.delegate, {
      type: 'Delegation',
      request: 'handle',
      quiet: true,
      flow: flow,
      message: message
    });
    return;
  }

  if (message.request === 'debug') {
    if (this.config.debug) {
      fdom.debug.print(message);
    }
    return;
  }

  if (message.request === 'link') {
    this.createLink(origin, message.name, message.to, message.overrideDest);
  } else if (message.request === 'port') {
    if (message.exposeManager) {
      message.args = this;
    }
    this.createLink(origin, message.name, 
        new fdom.port[message.service](message.args));
  } else if (message.request === 'bindport') {
    this.createLink({id: message.id},
                    'custom' + message.port,
                    new fdom.port[message.service](message.args),
                    'default',
                    true);
  } else if (message.request === 'delegate') {
    // Initate Delegation.
    if (this.delegate === null) {
      this.delegate = reverseFlow;
    }
    this.toDelegate[message.flow] = true;
    this.emit('delegate');
  } else if (message.request === 'resource') {
    fdom.resources.addResolver(message.args[0]);
    fdom.resources.addRetriever(message.service, message.args[1]);
  } else if (message.request === 'core') {
    if (this.core && reverseFlow === this.delegate) {
      (new this.core()).onMessage(origin, message.message);
      return;
    }
    this.getCore(function(to, core) {
      this.hub.onMessage(to, {
        type: 'core',
        core: core
      });
    }.bind(this, reverseFlow));
  } else if (message.request === 'close') {
    this.destroy(origin);
  } else if (message.request === 'unlink') {
    this.removeLink(origin, message.to);
  } else {
    fdom.debug.warn("Unknown control request: " + message.request);
    fdom.debug.log(JSON.stringify(message));
    return;
  }
};

/**
 * Set up a port with the hub.
 * @method setup
 * @param {Port} port The port to register.
 */
fdom.port.Manager.prototype.setup = function(port) {
  if (!port.id) {
    fdom.debug.warn("Refusing to setup unidentified port ");
    return false;
  }

  if(this.controlFlows[port.id]) {
    fdom.debug.warn("Refusing to re-initialize port " + port.id);
    return false;
  }

  if (!this.config.global) {
    this.once('config', this.setup.bind(this, port));
    return;
  }

  this.hub.register(port);
  var flow = this.hub.install(this, port.id, "control"),
      reverse = this.hub.install(port, this.id, port.id);
  this.controlFlows[port.id] = flow;
  this.dataFlows[port.id] = [reverse];
  this.reverseFlowMap[flow] = reverse;
  this.reverseFlowMap[reverse] = flow;

  this.hub.onMessage(flow, {
    type: 'setup',
    channel: reverse,
    config: this.config
  });

  return true;
};

/**
 * Tear down a port on the hub.
 * @method destroy
 * @apram {Port} port The port to unregister.
 */
fdom.port.Manager.prototype.destroy = function(port) {
  if (!port.id) {
    fdom.debug.warn("Unable to tear down unidentified port");
    return false;
  }

  // Remove the port.
  delete this.controlFlows[port.id];

  // Remove associated links.
  var i;
  for (i = this.dataFlows[port.id].length - 1; i >= 0; i -= 1) {
    this.removeLink(port, this.dataFlows[port.id][i]);
  }

  // Remove the port.
  delete this.dataFlows[port.id];
  this.hub.deregister(port);
};

/**
 * Create a link between two ports.  Links are created in both directions,
 * and a message with those capabilities is sent to the source port.
 * @method createLink
 * @param {Port} port The source port.
 * @param {String} name The flow for messages from destination to port.
 * @param {Port} destiantion The destination port.
 * @param {String} [destName] The flow name for messages to the destination.
 * @param {Boolean} [toDest] Tell the destination rather than source about the link.
 */
fdom.port.Manager.prototype.createLink = function(port, name, destination, destName, toDest) {
  if (!this.config.global) {
    this.once('config', this.createLink.bind(this, port, name, destination, destName));
    return; 
  }
  
  if (!this.controlFlows[port.id]) {
    fdom.debug.warn('Unwilling to link from non-registered source.');
    return;
  }

  if (!this.controlFlows[destination.id]) {
    if(this.setup(destination) === false) {
      fdom.debug.warn('Could not find or setup destination.');
      return;
    }
  }
  var outgoingName = destName || 'default',
      outgoing = this.hub.install(port, destination.id, outgoingName),
      reverse;

  // Recover the port so that listeners are installed.
  destination = this.hub.getDestination(outgoing);
  reverse = this.hub.install(destination, port.id, name);

  this.reverseFlowMap[outgoing] = reverse;
  this.dataFlows[port.id].push(outgoing);
  this.reverseFlowMap[reverse] = outgoing;
  this.dataFlows[destination.id].push(reverse);

  if (toDest) {
    this.hub.onMessage(this.controlFlows[destination.id], {
      type: 'createLink',
      name: outgoingName,
      channel: reverse,
      reverse: outgoing
    });
  } else {
    this.hub.onMessage(this.controlFlows[port.id], {
      name: name,
      type: 'createLink',
      channel: outgoing,
      reverse: reverse
    });
  }
};

/**
 * Remove a link between to ports. The reverse link will also be removed.
 * @method removeLink
 * @param {Port} port The source port.
 * @param {String} name The flow to be removed.
 */
fdom.port.Manager.prototype.removeLink = function(port, name) {
  var reverse = this.hub.getDestination(name),
      rflow = this.reverseFlowMap[name],
      i;

  if (!reverse || !rflow) {
    fdom.debug.warn("Could not find metadata to remove flow: " + name);
    return;
  }

  if (this.hub.getDestination(rflow).id !== port.id) {
    fdom.debug.warn("Source port does not own flow " + name);
    return;
  }

  // Notify ports that a channel is closing.
  i = this.controlFlows[port.id];
  if (i) {
    this.hub.onMessage(i, {
      type: 'close',
      channel: name
    });
  }
  i = this.controlFlows[reverse.id];
  if (i) {
    this.hub.onMessage(i, {
      type: 'close',
      channel: rflow
    });
  }

  // Uninstall the channel.
  this.hub.uninstall(port, name);
  this.hub.uninstall(reverse, rflow);

  delete this.reverseFlowMap[name];
  delete this.reverseFlowMap[rflow];
  if (this.dataFlows[reverse.id]) {
    for (i = 0; i < this.dataFlows[reverse.id].length; i += 1) {
      if (this.dataFlows[reverse.id][i] === rflow) {
        this.dataFlows[reverse.id].splice(i, 1);
        break;
      }
    }
  }
  if (this.dataFlows[port.id]) {
    for (i = 0; i < this.dataFlows[port.id].length; i += 1) {
      if (this.dataFlows[port.id][i] === name) {
        this.dataFlows[port.id].splice(i, 1);
        break;
      }
    }
  }
};

/**
 * Get the core freedom.js API active on the current hub.
 * @method getCore
 * @private
 * @param {Function} cb Callback to fire with the core object.
 */
fdom.port.Manager.prototype.getCore = function(cb) {
  if (this.core) {
    cb(this.core);
  } else {
    fdom.apis.getCore('core', this).then(function(core) {
      this.core = core;
      cb(this.core);
    }.bind(this));
  }
};

