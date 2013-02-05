var freedom = freedom || {};

freedom.Channel = function(context) {
  this.context = context;
  this.worker = null;
};

freedom.Channel.prototype.isAppContext = function() {
  return (typeof window === 'undefined');
}

freedom.Channel.prototype._startMain = function(app) {
  if (this.worker) {
    this.worker.terminate();
    this.worker = null;
  }
  this.worker = new Worker(app);
  this.worker.addEventListener('message', this.onMessage.bind(this), true);
  this.postMessage = function(m) {
    this.worker.postMessage(m);
  }
};

freedom.Channel.prototype._startApp = function() {
  this.context.config.global.addEventListener('message', this.onMessage.bind(this), true);
  this.postMessage = function(m) {
    this.context.config.global.postMessage(m);
  }
};

freedom.Channel.prototype.start = function(app) {
  if (this.isAppContext()) {
    this._startApp();
  } else {
    this._startMain(app);
  }
};

freedom.Channel.prototype.onMessage = function(e) {
  console.log(e);
};

freedom.Channel.prototype.postMessage = function(m) {
  console.warn("Channel not functioning.");
};
