// TODO: This should make use of ECMA6 Proxies once they are standardized.
// see: https://code.google.com/p/v8/issues/detail?id=1543
if (typeof fdom === 'undefined') {
  fdom = {};
}

/**
 * A fdomProxy or subclass are the exposed interface for freedom applications
 * and providers.  The interface is determined by the constructor arguments.
 * Three types of proxies are currently used:
 * A generic messageChannel, which allows for events ('emit', 'on'), and properties ('set', 'get').
 * A templatedProxy, which appears as a pre-defined definition.
 * A templatedDelegator, which delegates calls to a provider implementing a pre-defined definition.
 * @param {fdom.Channel} channel the Channel backing this interface.
 * @param {Object?} definition An API definition if one is specified.
 * @param {boolean} provider Whether this interface provides or consumes a service.
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
    proxy = new fdom.Proxy.messageChannel(channel, hash);
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
 * @param {fdom.Proxy} proxy The proxy to identify
 * @returns {Array.<String>} A transferable identifier for the proxy.
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
 * @param {fdom.Channel} channel The channel backing the proxy interface.
 * @param {Object} definition The API definition if the channel is a provider.
 * @param {Array.<String>} identifier The identifier for the channel.
 */
fdom.Proxy.get = function(channel, definition, identifier) {
  if (definition) {
    return new fdom.Proxy.templatedProxy(channel, definition, {flowId: identifier[2]});
  } else {
    return new fdom.Proxy.messageChannel(channel);
  }
};

/**
 * A freedom endpoint for an unconstrained, unpriveledged channel.
 * @param {fdom.Channel} channel The Channel backing this interface.
 * @constructor
 */
fdom.Proxy.messageChannel = function(channel, hash) {
  handleEvents(this);
  if (hash) {
    fdom.Proxy.registry[hash] = [channel, channel.flow];
  }
  var emitter = this['emit'];
  var values = {};

  Object.defineProperty(this, 'reflectEvents', {
    enumerable: false,
    configurable: false,
    writable: true,
    value: true
  });

  /**
   * Update emission of events to cross the underlying channel.
   * @param {String} type The type of message to send.
   * @param {Object} data The message to send.
   */
  this['emit'] = function(type, data) {
    channel.postMessage({
      'action': 'event',
      'type': type,
      'data': data
    });
    
    if (this['reflectEvents']) {
      emitter(type, data);
    }
  };

  /**
   * Get a property from this object.
   * @param {String} key the property to get.
   */
  this.get = function(key) {
    if (values.hasOwnProperty(key)) {
      return values[key];
    } else {
      return undefined;
    }
  };

  /**
   * Set a property on this object, and replicate across the channel.
   * @param {String} key the property to set.
   * @param {JSON} value the value for the property.
   */
  this.set = function(key, value) {
    if (values.hasOwnProperty(key) || values[key] === undefined) {
      values[key] = value;
      channel.postMessage({
        'action': 'set',
        'key': key,
        'value': value
      });
    }
  };
  
  /**
   * Handle messages from across the channel.
   */
  channel['on']('message', function(msg) {
    if (!msg) return;
    if (msg['action'] == 'event') {
      emitter(msg['type'], msg['data']);
    } else if (msg['action'] == 'set') {
      values[msg['key']] = msg['value'];
    }
  });  
};
