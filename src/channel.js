var fdom = fdom || {};

fdom.Channel = function(context) {
  this.state = fdom.Channel.State.NEW;
  this.context = context;
  this.worker = null;
  this.app = null;
  this.listeners = [];
};

fdom.Channel.State = {
  NEW: 1,
  STARTING: 2,
  RUNNING: 3
};

fdom.Channel.prototype.isAppContext = function() {
  return (typeof window === 'undefined');
}

fdom.Channel.prototype._startMain = function(app) {
  if (this.worker) {
    this.worker.terminate();
    this.worker = null;
  }
  this.app = app;
  this.worker = new Worker(this.context.config.source);
  this.worker.addEventListener('message', this.onMessage.bind(this), true);
  this.postMessage = function(m) {
    this.worker.postMessage(m);
  }
};

fdom.Channel.prototype._startApp = function() {
  this.context.config.global.addEventListener('message', this.onMessage.bind(this), true);
  this.postMessage = function(m) {
    this.context.config.global.postMessage(m);
  }
  this.postMessage("RUNNING");
};

fdom.Channel.prototype.start = function(app) {
  this.context.config.global._channel = this;
  if (this.isAppContext()) {
    this._startApp();
  } else {
    this._startMain(app);
  }
};

fdom.Channel.prototype.onMessage = function(e) {
  if (this.isAppContext()) {
    lastEvt = e;
    if (this.state == fdom.Channel.State.NEW) {
      this.app = e.data.app;
      this.manifest = e.data.manifest;
      var absoluteApp = this.manifest.substr(0, this.manifest.lastIndexOf("/")) + "/"  + this.app;
      this.postMessage("RUNNING");
      this.state = fdom.Channel.State.RUNNING;
      importScripts(absoluteApp);
    } else {
      
    }
  } else {
    if (this.state == fdom.Channel.State.NEW && e.data == "RUNNING") {
      this.state = fdom.Channel.State.STARTING;
      this.postMessage({
        manifest: this.context.config.manifest,
        app: this.app
      });
    } else if (this.state == fdom.Channel.State.STARTING && e.data == "RUNNING") {
      this.state = fdom.Channel.State.RUNNING;
    } else {
      //call listeners.
    }
  }
};

fdom.Channel.prototype.postMessage = function(m) {
  console.warn("Channel not functioning.");
};

fdom.Channel.prototype.addEventListener = function (event, listener) {
  if (event != "message") {
    throw "Unsupported Event Type";
  }
  this.listeners.push(listener);
}