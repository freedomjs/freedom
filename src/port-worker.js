/*globals fdom:true, handleEvents, mixin, isAppContext, Worker */
/*jslint indent:2, white:true, node:true, sloppy:true, browser:true */
if (typeof fdom === 'undefined') {
  fdom = {};
}
fdom.port = fdom.port || {};

/**
 * @constructor
 */
fdom.port.Worker = function() {
  this.id = 'Worker-' + Math.random();
  this.config = {};

  handleEvents(this);
};

fdom.port.Worker.prototype.start = function() {
  if (isAppContext()) {
    this.setupListener();
  } else {
    this.setupWorker();
  }
};

fdom.port.Worker.prototype.setupListener = function() {
  this.obj = this.config.global;
  this.config.global.addEventListener('message', function(msg) {
    this.emit(msg.flow, msg.message);
  }.bind(this), true);
  this.emit('started');
};

fdom.port.Worker.prototype.setupWorker = function() {
  if (typeof (window.Blob) !== typeof (Function)) {
    this.obj = new Worker(this.config.source);
  } else {
    var blob = new window.Blob([this.config.src], {type: 'text/javascript'});
    this.obj = new Worker(window.URL.createObjectURL(blob));
  }
  this.obj.addEventListener('message', function(msg) {
    this.emit(msg.flow, msg.message);
  }.bind(this), true);
  this.emit('started');
};

fdom.port.Worker.prototype.onMessage = function(flow, message) {
  if (flow === 'control') {
    if (!this.controlChannel && message.channel) {
      this.controlChannel = message.channel;
      mixin(this.config, message.config);
      this.start();
    }
  } else {
    if (this.obj) {
      this.obj.postMessage({
        flow: flow,
        message: message
      });
    } else {
      this.once('started', this.onMessage.bind(this, flow, message));
    }
  }
};

