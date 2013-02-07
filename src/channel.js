var fdom = fdom || {};

fdom.Channel = function(context) {
  this.state = fdom.Channel.State.NEW;
  this.context = context;
  this.worker = null;
  this.app = null;
  handleEvents(this);
};

fdom.Channel.State = {
  NEW: 1,
  STARTING: 2,
  RUNNING: 3
};

/**
 * Determine if execution is working in a web worker,
 * Or a direct browser page.
 */
fdom.Channel.prototype.isAppContext = function() {
  return (typeof window === 'undefined');
}

/**
 * Start a channel from a non-worker context, by generating
 * an on-the-fly app context.
 */
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

/**
 * Start a channel from a worker context, by connecting back
 * to the executing page.
 */
fdom.Channel.prototype._startApp = function() {
  this.context.config.global.addEventListener('message', this.onMessage.bind(this), true);
  this.postMessage = function(m) {
    this.context.config.global.postMessage(m);
  }
  this.postMessage("RUNNING");
};

/**
 * Start a channel for a desired app. If this is the app, it will connect
 * back to the creator, otherwise it will generate an appropriate sandbox
 * to launch the app.
 */
fdom.Channel.prototype.start = function(app) {
  this.context.config.global._channel = this;
  if (this.isAppContext()) {
    this._startApp();
  } else {
    this._startMain(app);
  }
};

/**
 * Handle a message from across the channel.
 */
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
      this['emit']('connect', null);
    } else {
      this['emit']('message', e.data);
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
      this['emit']('connect', null);
    } else {
      this['emit']('message', e.data);
    }
  }
};

fdom.Channel.prototype.postMessage = function(m) {
  this['once']('connect', function() {
    this.postMessage(m);
  }.bind(this));
};