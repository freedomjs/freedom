var fdom = fdom || {};

/**
 * A freedom channel abstracts one hole into or out-of an App.
 * @class Channel
 */
fdom.Channel = function(app, flow) {
  this.app = app;  // The app (internal or external)
  this.flow = flow;
  handleEvents(this);
};

/**
 * Handle a message from across the channel.
 * @method onMessage
 */
fdom.Channel.prototype.onMessage = function(e) {
  this['emit']('message', e['type'] ? e : e.data);
};

/**
 * Post a message to this channel.
 * @method postMessage
 */
fdom.Channel.prototype.postMessage = function(m) {
  this.app.postMessage({
    sourceFlow: this.flow,
    msg: m
  });
};

/**
 * Create a pair of channels which relay messages to each other.
 * @method pipe
 * @static
 * @returns {Channel[]} The two ends of the created pipe.
 */
fdom.Channel.pipe = function() {
  var first = {};
  var second = {};
  handleEvents(first);
  handleEvents(second);
  first.postMessage = function(msg) {
    second['emit']('message', msg);
  };
  second.postMessage = function(msg) {
    first['emit']('message', msg);
  };
  return [first, second];
};
