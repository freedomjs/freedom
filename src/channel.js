var fdom = fdom || {};

fdom.Channel = function(context) {
  this.context = context;
  this.worker = null;
};

fdom.Channel.prototype.isAppContext = function() {
  return (typeof window === 'undefined');
}

fdom.Channel.prototype._startMain = function(app) {
  if (this.worker) {
    this.worker.terminate();
    this.worker = null;
  }
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
  console.log(e);
};

fdom.Channel.prototype.postMessage = function(m) {
  console.warn("Channel not functioning.");
};
