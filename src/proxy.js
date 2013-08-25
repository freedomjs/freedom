// TODO: This should make use of ECMA6 Proxies once they are standardized.
// see: https://code.google.com/p/v8/issues/detail?id=1543
if (typeof fdom === 'undefined') {
  fdom = {};
}

/**
 * A fdomProxy or subclass are the exposed interface for freedom applications
 * and providers.  The interface is determined by the constructor arguments.
 * Three types of proxies are currently used:
 * A generic messageProxy
, which allows for events ('emit', 'on'), and properties ('set', 'get').
 * A templatedProxy, which appears as a pre-defined definition.
 * A templatedDelegator, which delegates calls to a provider implementing a pre-defined definition.
 * @param {Channel} channel the Channel backing this interface.
 * @param {Object?} definition An API definition if one is specified.
 * @param {boolean} provider Whether this interface provides or consumes a service.
 * @class Proxy
 * @constructor
 */
fdom.Proxy = function(channel, definition, provider) {
  var proxy;

  // TODO(willscott): remove collision potential
  var hash = channel.flow + Math.random();

  if (definition) {
    if (provider) {
      proxy = new fdom.Proxy.templatedDelegator(channel, definition);
    } else {
      proxy = new fdom.Proxy.templatedProxy(channel, definition, {hash: hash});
    }
  } else {
    proxy = new fdom.Proxy.messageProxy(channel, hash);
  }
  Object.defineProperty(proxy, '__identifier', {
    enumerable: false,
    configurable: false,
    writable: false,
    value: hash
  });
  return proxy;
};


/**
 * A registry of created proxies, used for resolving proxies back
 * to identifiers in order to resolve channels within the freedom core.
 */
fdom.Proxy.registry = {};

/**
 * Get an identifier for a proxy, in order to transfer the capability
 * to access that channel across application boundaries
 * @method getIdentifier
 * @static
 * @param {Proxy} proxy The proxy to identify
 * @returns {String[]} A transferable identifier for the proxy.
 */
fdom.Proxy.getIdentifier = function(proxy) {
  if (fdom.Proxy.registry[proxy['__identifier']]) {
    var info = fdom.Proxy.registry[proxy['__identifier']];
    return [info[0].app.id, info[1], info[2]];
  } else {
    return undefined;
  }
};

/**
 * Reconstitute a proxy from a channel and Identifier.
 * @method get
 * @static
 * @param {Channel} channel The channel backing the proxy interface.
 * @param {Object} definition The API definition if the channel is a provider.
 * @param {String[]} identifier The identifier for the channel.
 */
fdom.Proxy.get = function(channel, definition, identifier) {
  if (definition) {
    return new fdom.Proxy.templatedProxy(channel, definition, {flowId: identifier[2]});
  } else {
    return new fdom.Proxy.messageProxy(channel);
  }
};
