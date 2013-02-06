// TODO: This should make use of ECMA6 Proxies once they are standardized.
// see: https://code.google.com/p/v8/issues/detail?id=1543
var fdom = fdom || {};

fdom.Proxy = function(channel) {
  var values = {};
  var listeners = {};

  this.get = function(key) {
    if (values.hasOwnProperty(key)) {
      return values[key];
    } else {
      return undefined;
    }
  };

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
  
  this['emit'] = function(type, data) {
    channel.postMessage({
      'action': 'event',
      'type': type,
      'data': data
    });
    emitter(type, data);
  };

  channel['on']('message', function(msg) {
    if (msg['action'] == 'set') {
      this.set(msg['key'], msg['value'])
    } else if (msg['action'] == ['event']) {
      emitter(msg['type'], msg['data']);
    }
  })
};
