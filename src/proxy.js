// TODO: This should make use of ECMA6 Proxies once they are standardized.
// see: https://code.google.com/p/v8/issues/detail?id=1543
var fdom = fdom || {};

fdom.Proxy = function(channel) {
  var values = {};
  var listeners = {};

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

  handleEvents(this);
  var emitter = this['emit'];
  
  /**
   * Update emission of events to cross the underlying channel.
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
   * Handle messages from across the channel.
   */
  channel['on']('message', function(msg) {
    if (msg['action'] == 'set') {
      values[msg['key']] = msg['value'];
    } else if (msg['action'] == 'event') {
      emitter(msg['type'], msg['data']);
    }
  })
};
