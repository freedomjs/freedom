var fdom = fdom || {};

/**
 * Defines fdom.Hub, the core message hub between freedom modules.
 * Incomming messages from apps are sent to hub.onMessage()
 * Use fdom.Hub.get() for the singleton instance.
 * @private
 * @constructor
 */
fdom.Hub = function() {
  this.config = {};
  this.apps = {};
  this.pipes = {};
  this.unbound = [];
  handleEvents(this);
};

/**
 * Singleton accessor for fdom.Hub.
 * @returns {fdom.Hub} The singleton freedom hub interconnecting freedom modules.
 */
fdom.Hub.get = function() {
  if (!fdom.Hub._hub) {
    fdom.Hub._hub = new fdom.Hub();
  }
  window.hub = fdom.Hub._hub;
  return fdom.Hub._hub;
};

/**
 * Handle an incoming message from a freedom app.
 * @param {fdom.app} app The app sending the message.
 * @param {Object} message The sent message.
 */
fdom.Hub.prototype.onMessage = function(app, message) {
  if (!this.apps[app.id]) {
    console.warn("Message dropped from unregistered app " + app.id);
    return;
  }
  var flows = this.pipes[app.id];
  var flow = message.sourceFlow;
  var destChannel = flows[flow];

  if (flow == 'control') {
    if (this.config['debug'] && message.request != 'debug') {
      console.log(app.id + " -C " + message.request);
    } else if (this.config['debug']) {
      console.log(app.id + " -D " + message.msg);
    }
    // Signaling Channel.
    if (message.request == 'dep') {
      this.createPipe(app, message.dep);
    } else if (message.request == 'create') {
      var config = {
        "debug": this.config['debug']
      };

      app.postMessage({
        sourceFlow: 'control',
        msg: {
          id: app.id,
          manifest: app.manifest,
          config: config
        }
      });
      this.permitAccess(app.id);
    } else if (message.request == 'ready') {
      app.ready();
    } else if (message.request == 'channel') {
      // Register new unprivileged message channel.
      var flow = 'custom' + Math.random();

      // Binding a channel.
      if (message.to) {
        var aid = message.to[0];
        var dep = this.apps[aid];
        var endpoint = false;
        for (var i = 0; i < this.unbound.length; i++) {
          if (this.unbound[i][0] == dep) {
            endpoint = this.unbound[i];
            this.unbound.splice(i, 1);
            break;
          }
        }
        if (endpoint) {
          var other = endpoint[0];
          if (this.pipes[app.id][flow] || this.pipes[other.id][endpoint[1]]) {
            console.warn("unwilling to redefine existing pipes.");
          } else {
            this.pipes[app.id][flow] = other.getChannel(endpoint[1]);
            this.pipes[other.id][endpoint[1]] = app.getChannel(flow);
          }
        }
      } else {
        // TODO: make sure apps can't make infinite unbound pipes.
        this.unbound.push([app, flow]);
      }

      app.postMessage({
        sourceFlow: 'control',
        msg: {
          flow: flow
        }
      });
    }
  } else if (destChannel) {
    if (this.config['debug']) {
      console.log(app.id + " -> " + flow + " " + message.msg.action + " " + message.msg.type);
    }

    // Deliver Message
    if (destChannel == app.getChannel(flow)) {
      destChannel.onMessage(message.msg);
    } else {
      destChannel.postMessage(message.msg);
    }
  } else {
    var af = []
    for(var i in flows) {
      af.push(i);
    }
    console.warn("Message dropped from unregistered flow " + app.id + " -> " + flow);
    console.log(message.msg);
  }
};

/**
 * Ensure than an application is enstantiated. and registered.
 * @param {String} id The URL identifying the app.
 */
fdom.Hub.prototype.ensureApp = function(id) {
  var canonicalId = makeAbsolute(id);
  if (!this.apps[canonicalId]) {
    var newApp = new fdom.app.External();
    newApp.configure(this.config);
    newApp.configure({
      manifest: canonicalId
    });
    this.apps[canonicalId] = newApp;
  }
  return canonicalId;
}

/**
 * Establish a communication channel between an application and one of its dependencies.
 * @param {fdom.app} app The application establishing communication.
 * @param {String} dep The identifier of the dependency.
 */
fdom.Hub.prototype.createPipe = function(app, dep) {
  // 1. Make sure source has permissions to create the pipe.
  if (!app.manifest['dependencies'].hasOwnProperty(dep)) {
    console.warn("Dependency requested that was undeclared in app manifest");
    return false;
  }

  // 2. Make sure the dependency exists.
  var depId = this.ensureApp(app.manifest['dependencies'][dep]);
  var depApp = this.apps[depId];

  // 3. Register the link
  this.pipes[app.id][dep] = depApp.getChannel('default');
  this.pipes[depId] = {'default': app.getChannel(dep)};
}

/**
 * Register an application with the hub.
 * @param {fdom.app} app The application to register. 
 */
fdom.Hub.prototype.register = function(app) {
  if (!this.apps[app.id]) {
    this.apps[app.id] = app;
    this.pipes[app.id] = {'default' : app.channels['default']};
  }
  this['emit']('register', app);
}

/**
 * Register permissions of a freedom application.
 * @param String id The application for whom to register permissions.
 * @private
 */
fdom.Hub.prototype.permitAccess = function(id) {
  if (!this.apps[id]) {
    console.warn("Registration requested for unknown App " + id);
    return;
  }
  if (!this.apps[id].manifest['permissions']) {
    return;
  }
  for (var i = 0; i < this.apps[id].manifest['permissions'].length; i++) {
    var permission = this.apps[id].manifest['permissions'][i];
    if (permission.indexOf("core.") === 0) {
      this.pipes[id][permission] = fdom.apis.getCore(permission, this.apps[id].getChannel(permission));
    }
  }
}

/**
 * Bind an unbound app channel to a service implementing 'postMessage'.
 */
fdom.Hub.prototype.bindChannel = function(id, flow, service) {
  var dep = this.apps[id];
  var endpoint = false;
  for (var i = 0; i < this.unbound.length; i++) {
    if (this.unbound[i][0] == dep) {
      endpoint = this.unbound[i];
      this.unbound.splice(i, 1);
      break;
    }
  }
  if (endpoint) {
    if (this.pipes[endpoint[0].id][endpoint[1]]) {
      console.warn("unwilling to redefine existing pipes.");
    } else {
      console.log("Custom channel bound: " + endpoint[1]);
      this.pipes[endpoint[0].id][endpoint[1]] = service;
      return true;
    }
  }
  return false;
};
