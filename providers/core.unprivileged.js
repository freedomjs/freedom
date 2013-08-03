/**
 * Core freedom services available to all modules.
 * @constructor
 * @private
 */
var Core_unprivileged = function(pipe, app) {
  if (app) {
    this.app = app;
  } else {
    var base = fdom.Proxy.getIdentifier(global['freedom']);
    for (var id in fdom.Proxy.registry) {
      var proxy = fdom.Proxy.registry[id][0];
      if (proxy.app && proxy.app.id == base[0]) {
        this.app = proxy.app;
        break;
      }
    }
  }
};

Core_unprivileged.prototype.onResponse = function(continuation) {
  this.app['once'](function(type, msg) {
    return type == 'message' && msg.data.sourceFlow == 'control';
  }, function(cb, msg) {
    var id = msg.data.msg.flow;
    var chan = this.app.getProxy(id);
    cb(chan);
  }.bind(this, continuation));
};

Core_unprivileged.prototype.createChannel = function(continuation) {
  this.onResponse(continuation);

  this.app.postMessage({
    sourceFlow: 'control',
    request: 'channel'
  });
};

Core_unprivileged.prototype.bindChannel = function(identifier, continuation) {
  this.onResponse(continuation);

  this.app.postMessage({
    sourceFlow: 'control',
    request: 'channel',
    to: identifier
  });
};

Core_unprivileged.bindChannel = function(identifier) {
  var pipe = fdom.Channel.pipe();
  fdom.Hub.get().bindChannel(identifier[0], identifier[1], pipe[0]);
  //TODO(willscott): this is sketchy :-/
  var app = fdom.Hub.get().apps[identifier[0]];
  var flow = app.getChannel(identifier[1]);
  pipe[0]['on']('message', flow.postMessage.bind(flow));
  return pipe[1];
};

fdom.apis.register("core", Core_unprivileged);
