fdom.Proxy.templatedProxy = function(channel, definition) {
  var inflight = [];

  eachProp(definition, function(prop, name) {
    switch(prop['type']) {
      case "property":
        break;
      case "method":
        this[name] = function() {
          channel.postMessage({
            'action': 'method',
            'type': name,
            'value': conform(prop.value, arguments)
          });
          var deferred = fdom.Proxy.Deferred();
          inflight.push(deferred);
          return deferred['promise']();
        }
        break;
    }
  }.bind(this));

  channel['on']('message', function(msg) {
    if (!msg) return;
    if (msg.action == 'method') {
      inflight.pop()['resolve'](msg.value);
    }
  });
};

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
