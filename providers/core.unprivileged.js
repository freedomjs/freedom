/*globals fdom:true, handleEvents, mixin, eachProp, makeAbsolute */
/*jslint indent:2,white:true,sloppy:true */

/**
 * Core freedom services available to all modules.
 * @Class Core_unprivileged
 * @constructor
 * @private
 */
var Core_unprivileged = function(appInternal) {
  this.app = appInternal;
};

/**
 * Create a custom channel.
 * Returns the structure {channel: fdom.proxy.Deferred, identifier: Object},
 * where the identifier can be 'redeemed' by another module or provider using
 * bind channel, at which point the deferred object will resolve with a channel
 * between the two endpoints.
 * @method createChannel
 * @params {Function} continuation Method to call with the cosntructed structure.
 */
Core_unprivileged.prototype.createChannel = function(continuation) {
  var proxy = new fdom.port.Proxy(fdom.proxy.EventInterface),
      deferred = fdom.proxy.Deferred();
  this.app.manager.setup(proxy);

  proxy.once('start', function(deferred, proxy) {
    deferred.resolve(proxy.getInterface());
  }.bind(this, deferred, proxy));

  // TODO(willscott): Using proxy.id directly is probably worse that a truely
  // opaque identifier.
  continuation({
    channel: deferred,
    identifier: [this.app.appId, proxy.id]
  });
};

/**
 * Bind a custom channel.
 * Creates a proxy interface to the custom channel, which will be bound to
 * the proxy obtained through an earlier createChannel call.
 * channel to a proxy.
 * @method bindChannel
 * @param {Object} identifier An identifier obtained through createChannel.
 * @param {Function} continuation A function to be called with the proxy.
 */
Core_unprivileged.prototype.bindChannel = function(identifier, continuation) {
  var proxy = new fdom.port.Proxy(fdom.proxy.EventInterface),
      appId = identifier[0];

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
    name: 'default',
    to: {id: identifier[0]},
    overrideDest: 'custom' + identifier[1]
  });
  
  return proxy.getInterface();
};

fdom.apis.register("core", Core_unprivileged);
