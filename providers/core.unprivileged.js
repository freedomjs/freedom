/**
 * Core freedom services available to all modules.
 * @constructor
 * @private
 */
var Core_unprivileged = function(appInternal) {
  this.app = appInternal;
};

Core_unprivileged.prototype.createChannel = function(continuation) {
  var proxy = new fdom.port.Proxy(fdom.proxy.EventInterface);
  this.app.manager.setup(proxy);

  // TODO(willscott): Using proxy.id directly is probably worse that a truely
  // opaque identifier.
  continuation({
    channel: proxy.getInterface(),
    identifier: [this.app.appId, proxy.id]
  });
};

Core_unprivileged.prototype.bindChannel = function(identifier, continuation) {
  var proxy = new fdom.port.Proxy(fdom.proxy.EventInterface);
    
  var appId = identifier[0];
  if (appId === this.app.appId) {
    this.app.manager.createLink(proxy, 'default', {id: identifier[1]});
    continuation(proxy.getInterface());
  } else {
    this.manager.createLink(this.port,
        JSON.stringify(['UserLink', appId, identifier[1]]), proxy);
    proxy.once('start', function() {
      continuation(proxy.getInterface());
    });
  }
};

Core_unprivileged.bindChannel = function(app, identifier) {
  var proxy = new fdom.port.Proxy(fdom.proxy.EventInterface);
  // Register proxy.
  app.emit(app.controlChannel, {
    type: 'Custom Channel ' + identifier[0] + '.' + identifier[1],
    request: 'link',
    name: 'custom-' + identifier[0] + identifier[1],
    to: proxy
  });
  
  proxy.emit(proxy.controlChannel, {
    type: 'Custom Channel Link ' + identifier[0] + '.' + identifier[1],
    request: 'link',
    name: identifier[1],
    to: {id: identifier[0]}
  });
  
  return proxy.getInterface();
};

fdom.apis.register("core", Core_unprivileged);
