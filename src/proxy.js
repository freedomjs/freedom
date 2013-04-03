// TODO: This should make use of ECMA6 Proxies once they are standardized.
// see: https://code.google.com/p/v8/issues/detail?id=1543
var fdom = fdom || {};

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
  if (definition) {
    if (provider) {
      return new fdom.Proxy.templatedDelegator(channel, definition);
    } else {
      return new fdom.Proxy.templatedProxy(channel, definition);
    }
  } else {
    return new fdom.Proxy.messageChannel(channel);
  }
};


/**
 * A freedom endpoint for an unconstrained, unpriveledged channel.
 * @param {fdom.Channel} channel The Channel backing this interface.
 * @constructor
 */
fdom.Proxy.messageChannel = function(channel) {
  handleEvents(this);
  var emitter = this['emit'];
  var values = {};

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
    emitter(type, data);
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
  }
  
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
