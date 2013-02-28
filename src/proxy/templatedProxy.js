fdom.Proxy.templatedProxy = function(channel, definition) {
  var inflight = {};
  var events = null;
  var self = this;
  var id = Math.random();

  eachProp(definition, function(prop, name) {
    switch(prop['type']) {
      case "property":
        //TODO(willscott): how should asyncronous properties work?
        break;
      case "method":
        this[name] = function() {
          channel.postMessage({
            'action': 'method',
            'type': name,
            'id': id,
            'value': conform(prop.value, arguments)
          });
          var deferred = fdom.Proxy.Deferred();
          inflight[id] = deferred;
          id++;
          return deferred['promise']();
        }
        break;
      case "event":
        if(!events) {
          handleEvents(this);
          events = {};
        }
        events[name] = prop;
        break
    }
  }.bind(this));

  channel['on']('message', function(msg) {
    if (!msg) return;
    if (msg.action == 'method') {
      if (inflight[msg.id]) {
        var deferred = inflight[msg.id];
        delete inflight[msg.id];
        deferred['resolve'](msg.value);
      } else {
        console.log("Dropped response message with id " + msg.id);
      }
      inflight.pop()['resolve'](msg.value);
    } else if (msg.action == 'event') {
      var prop = events[msg.type];
      if (prop) {
        var val = conform(prop.value, [msg.value]);
        self['emit'](msg.type, val);
      }
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
      case "object":
        // Allow removal, since sandboxing will enforce this.
        out[i] = JSON.parse(JSON.stringify(values[i]));
        break;
      default:
        out[i] = false;
        break;
    }
  }
  return out;
};
