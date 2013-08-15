/**
 * A proxy exposing a predefined interface
 * @class templatedProxy
 * @extends Proxy
 */
fdom.Proxy.templatedProxy = function(channel, definition, identifier) {
  var inflight = {};
  var events = null;
  var emitter = null;
  var flowId;
  if (identifier.flowId) {
    flowId = identifier.flowId;
  } else {
    flowId = Math.random();
  }
  if (identifier.hash) {
    fdom.Proxy.registry[identifier.hash] = [channel, channel.flow, flowId];
  }
  var reqId = 0;

  eachProp(definition, function(prop, name) {
    switch(prop['type']) {
      case "property":
        //TODO(willscott): how should asynchronous properties work?
        break;
      case "method":
        this[name] = function() {
          // Note: inflight should be registered before message is passed
          // in order to prepare for synchronous in-window pipes.
          var deferred = fdom.Proxy.Deferred();
          inflight[reqId] = deferred;
          channel.postMessage({
            'action': 'method',
            'type': name,
            reqId: reqId,
            flowId: flowId,
            'value': conform(prop.value, arguments)
          });
          reqId++;
          return deferred['promise']();
        };
        break;
      case "event":
        if(!events) {
          handleEvents(this);
          emitter = this['emit'];
          delete this['emit'];
          events = {};
        }
        events[name] = prop;
        break;
    }
  }.bind(this));

  channel['on']('message', function(msg) {
    if (!msg) return;
    if (msg.flowId != flowId) return;
    if (msg.action == 'method') {
      if (inflight[msg.reqId]) {
        var deferred = inflight[msg.reqId];
        delete inflight[msg.reqId];
        deferred['resolve'](msg.value);
      } else {
        console.log("Dropped response message with id " + msg.reqId);
      }
    } else if (msg.action == 'event') {
      var prop = events[msg.type];
      if (prop) {
        var val = conform(prop.value, msg.value);
        emitter(msg.type, val);
      }
    }
  });
  
  if (!identifier.flowId) {
    channel.postMessage({
      'action': 'construct',
      'type': 'construct',
      flowId: flowId
    });
  }
};

/**
 * Force a collection of values to look like the types and length of an API template.
 */
var conform = function(template, value) {
  switch(template) {
    case "string":
      return "" + value;
    case "number":
      return 1 * value;
    case "bool":
      return Boolean(false | value);
    case "object":
      // TODO(willscott): Allow removal if sandboxing enforces this.
      return JSON.parse(JSON.stringify(value));
    case "blob":
      return value instanceof Blob ? value : new Blob([]);
    case "buffer":
      return value instanceof ArrayBuffer ? value : new ArrayBuffer(0);
    case "data":
      // TODO(willscott): should be opaque to non-creator.
      return value;
    case "proxy":
      if (Array.isArray(value)) {
        return value;
      } else {
        return fdom.Proxy.getIdentifier(value);
      }
  }
  var val;
  if (Array.isArray(template)) {
    val = [];
    var i = 0;
    if (template.length == 2 && template[0] == "array") {
      //console.log("template is array, value is " + JSON.stringify(value));
      for (i = 0; i < value.length; i++) {
        val.push(conform(template[1], value[i]));
      }
    } else {
      for (i = 0; i < template.length; i++) {
        if (value[i] === null || value[i]) {
          val.push(conform(template[i], value[i]));
        } else {
          val.push(undefined);
        }
      }
    }
    return val;
  } else if (typeof template === "object") {
    val = {};
    eachProp(template, function(prop, name) {
      if (value[name]) {
        val[name] = conform(prop, value[name]);
      }
    });
    return val;
  }
  console.log("Conform ignoring value for template:"+template);
  console.log(value);
};
