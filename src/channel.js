var fdom = fdom || {};

fdom.Channel = function(app, flow) {
  this.app = app;  // The App ID
  this.flow = flow;
  handleEvents(this);
};

/**
 * Handle a message from across the channel.
 */
fdom.Channel.prototype.onMessage = function(e) {
  this['emit']('message', e['type'] ? e : e.data);
};

fdom.Channel.prototype.postMessage = function(m) {
  this.app.postMessage({
    sourceFlow: this.flow,
    msg: m
  });
};

fdom.Channel.prototype.getProxy = function() {
  var self = this;
  var out = {};
  handleEvents(out);
  out['on']('message', function(msg) {
    self['emit']('message', msg);
  })
  return out;
}