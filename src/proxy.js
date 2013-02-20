// TODO: This should make use of ECMA6 Proxies once they are standardized.
// see: https://code.google.com/p/v8/issues/detail?id=1543
var fdom = fdom || {};

/**
 * Force a collection of values to look like the types and length of an API template.
 */
function conform(template, values) {
  var out = [];
  for (var i = 0; i < template.length; i++) {
    switch(template[i]) {
      case "string":
        out[i] = "" + values[i];
        break;
      case "number":
        out[i] = 0 + values[i];
        break;
      case "bool":
        out[i] = false | values[i];
        break;
      //TODO(willscott): ArrayBuffer or reference type.
      case "callback":
        if (typeof values[i] == "function") {
          out[i] = values[i];
        } else {
          out[i] = function() {};
        }
        break;
      default:
        out[i] = false;
        break;
    }
  }
  return out;
};

fdom.Proxy = function(channel, definition) {
  var listeners = {};

  handleEvents(this);

  var emitter = this['emit'];

  if (definition) {
    var props = {};

    eachProp(definition, function(prop, name) {
      switch(prop['type']) {
        case "method":
          this[name] = function(n) {
            var args = [];
            for (var i = 1; i < arguments.length; i++) {
              args.push(arguments[i]);
            }
            channel.postMessage({
              'action': 'method',
              'key': n,
              'data':conform(prop['value'], args)
            });
          }.bind(this, name)
          break;
        case "property":
          this.__defineGetter__(name, function(n) {
            return props[n];
          }.bind(this, name));
          this.__defineSetter__(name, function(n, val) {
            props[n] = val;
            channel.postMessage({
              'action': 'property',
              'key': n,
              'data': conform(prop['value'], val)
            });
          }.bind(this, name));
          break;
      }
    }.bind(this));

    /**
     * Handle messages from across the channel.
     */
    channel['on']('message', function(msg) {
      if (msg['action'] == 'prop') {
        props[msg['key']] = msg['data'];
      } else if (msg['action'] == 'method') {
        //TODO(willscott): associate return value with a deferred object.
        emitter(msg['key'], msg['data']);
      }
    });
  } else {
    var values = {};

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
      if (msg['action'] == 'event') {
        if (channel.app.debug) {
          channel.app.debug("Event " + msg['type'] + " raised.");
        }
        emitter(msg['type'], msg['data']);
      } else if (msg['action'] == 'set') {
        values[msg['key']] = msg['value'];
      }
    });  
  }
};
