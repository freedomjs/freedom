// TODO: This should make use of ECMA6 Proxies once they are standardized.
// see: https://code.google.com/p/v8/issues/detail?id=1543
var fdom = fdom || {};

fdom.Proxy = function(channel) {
  var values = {};
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
    }
  };

  channel.addEventListener('message', function(msg) {
    if (msg.type == 'set') {
      this.set(msg.key, msg.value)
    } else if (msg.type == 'event') {
      console.log(msg);
    }
  })
};
