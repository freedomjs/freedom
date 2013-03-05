var fdom = fdom || {};


fdom.Hub = function() {
  this.apps = {};
  this.pipes = {};
  handleEvents(this);
};

fdom.Hub.get = function() {
  if (!fdom.Hub._hub) {
    fdom.Hub._hub = new fdom.Hub();
  }
  window.hub = fdom.Hub._hub;
  return fdom.Hub._hub;
};

fdom.Hub.prototype.onMessage = function(app, message) {
  if (!this.apps[app.id]) {
    console.warn("Message dropped from unregistered app " + app.id);
    return;
  }
  var flows = this.pipes[app.id];
  var flow = message.sourceFlow;
  if (flow == 'control') {
    if (message.request != 'debug') {
      console.log(app.id + " -C " + message.request);
    } else {
      console.log(app.id + " -D " + message.msg);
    }
    // Signaling Channel.
    if (message.request == 'dep') {
      this.createPipe(app, message.dep);
    } else if (message.request == 'create') {
      app.postMessage({
        sourceFlow: 'control',
        msg: {
          id: app.id,
          manifest: app.manifest
        }
      });
      this.permitAccess(app.id);
    } else if (message.request == 'ready') {
      app['emit']('ready');
    }
  } else if (flows[flow]) {
    console.log(app.id + " -> " + flow + " " + message.msg.action + " " + message.msg.type);
    if (flows[flow] == app.getChannel(flow)) {
      flows[flow].onMessage(message.msg);
    } else {
      flows[flow].postMessage(message.msg);
    }
  } else {
    console.warn("Message dropped from unregistered flow " + app.id + " -> " + flow);
    var keys = [];
    for (var i in flows) {
      if (flows.hasOwnProperty(i)) {
        keys.push(i);
      }
    }
    console.warn("Available flows:" + keys);
  }
};

fdom.Hub.prototype.ensureApp = function(id, app) {
  var canonicalId = makeAbsolute(id);
  if (!this.apps[canonicalId]) {
    var newApp = new fdom.app.External();
    newApp.configure(app.config);
    newApp.configure({
      manifest: canonicalId
    });
    this.apps[canonicalId] = newApp;
  }
  return canonicalId;
}

fdom.Hub.prototype.createPipe = function(app, dep) {
  // 1. Make sure source has permissions to create the pipe.
  if (!app.manifest['dependencies'].hasOwnProperty(dep)) {
    console.warn("Dependency requested that was undeclared in app manifest");
    return false;
  }

  // 2. Make sure the dependency exists.
  var depId = this.ensureApp(app.manifest['dependencies'][dep], app);
  var depApp = this.apps[depId];

  // 3. Register the link
  this.pipes[app.id][dep] = depApp.getChannel('default');
  this.pipes[depId] = {'default': app.getChannel(dep)};
}

fdom.Hub.prototype.register = function(app) {
  if (!this.apps[app.id]) {
    this.apps[app.id] = app;
    this.pipes[app.id] = {'default' : app.channels['default']};
  }
  this['emit']('register', app);
}

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
