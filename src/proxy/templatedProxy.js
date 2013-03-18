fdom.Proxy.templatedProxy = function(channel, definition) {
  var inflight = {};
  var events = null;
  var emitter = null;
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
          emitter = this['emit'];
          delete this['emit'];
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
    } else if (msg.action == 'event') {
      var prop = events[msg.type];
      if (prop) {
        var val = conform(prop.value, msg.value);
        emitter(msg.type, val);
      }
    }
  });
};

/**
 * Force a collection of values to look like the types and length of an API template.
 */
function conform(template, value) {
  switch(template) {
    case "string":
      return "" + value;
    case "number":
      return 0 + value;
    case "bool":
      return false | value;
    case "object":
      // TODO(willscott): Allow removal if sandboxing enforces this.
      return JSON.parse(JSON.stringify(value));
    case "blob":
      return value instanceof Blob ? value : new Blob([]);
    case "buffer":
      return value instanceof ArrayBuffer ? value : new ArrayBuffer(0);
  }
  if (Array.isArray(template)) {
    var val = [];
    if (template.length == 2 && template[0] == "array") {
      //console.log("template is array, value is " + JSON.stringify(value));
      for (var i = 0; i < value.length; i++) {
        val.push(conform(template[1], value[i]));
      }
    } else {
      for (var i = 0; i < template.length; i++) {
        if (value[i]) val.push(conform(template[i], value[i]))
        else val.push(undefined);
      }
    }
    return val;
  } else if (typeof template === "object") {
    var val = {};
    eachProp(template, function(prop, name) {
      if (value[name]) {
        val[name] = conform(prop, value[name]);
      };
    });
    return val;
  }
}
