/*globals fdom:true, handleEvents, eachProp, Blob, ArrayBuffer */
/*jslint indent:2, white:true, node:true, sloppy:true, browser:true */
if (typeof fdom === 'undefined') {
  fdom = {};
}
fdom.proxy = fdom.proxy || {};

fdom.proxy.ApiInterface = function(def, onMsg, emit, id) {
  var inflight = {},
      events = null,
      emitter = null,
      reqId = 0;

  eachProp(def, function(prop, name) {
    switch(prop.type) {
    case 'property':
      //TODO(willscott): how should asynchronous properties work?
      break;
    case 'method':
      this[name] = function() {
        // Note: inflight should be registered before message is passed
        // in order to prepare for synchronous in-window pipes.
        var deferred = fdom.proxy.Deferred();
        inflight[reqId] = deferred;
        emit({
          to: id,
          action: 'method',
          type: name,
          reqId: reqId,
          value: fdom.proxy.conform(prop.value, arguments)
        });
        reqId += 1;
        return deferred.promise();
      };
      break;
    case 'event':
      if(!events) {
        handleEvents(this);
        emitter = this.emit;
        delete this.emit;
        events = {};
      }
      events[name] = prop;
      break;
    }
  }.bind(this));

  onMsg(function(type, msg) {
    if (!msg) {
      return;
    }
    if (type === 'method') {
      if (inflight[msg.reqId]) {
        var deferred = inflight[msg.reqId];
        delete inflight[msg.reqId];
        deferred.resolve(msg.value);
      } else {
        console.log('Dropped response message with id ' + msg.reqId);
      }
    } else if (type === 'event') {
      if (events[msg.type]) {
        emitter(msg.type, fdom.proxy.conform(events[msg.type].value, msg.value));
      }
    }
  }.bind(this));

  emit({
    'type': 'construct',
    'to': id
  });
};

/**
 * Force a collection of values to look like the types and length of an API template.
 */
fdom.proxy.conform = function(template, value) {
  switch(template) {
  case 'string':
    return String('') + value;
  case 'number':
    return Number(1) * value;
  case 'bool':
    return Boolean(value === true);
  case 'object':
    // TODO(willscott): Allow removal if sandboxing enforces this.
    return JSON.parse(JSON.stringify(value));
  case 'blob':
    return value instanceof Blob ? value : new Blob([]);
  case 'buffer':
    return value instanceof ArrayBuffer ? value : new ArrayBuffer(0);
  case 'data':
    // TODO(willscott): should be opaque to non-creator.
    return value;
  case 'proxy':
    if (Array.isArray(value)) {
      return value;
    } else {
      // TODO: make proxy.
      return value;
    }
  }
  var val, i;
  if (Array.isArray(template)) {
    val = [];
    i = 0;
    if (template.length === 2 && template[0] === 'array') {
      //console.log("template is array, value is " + JSON.stringify(value));
      for (i = 0; i < value.length; i += 1) {
        val.push(fdom.proxy.conform(template[1], value[i]));
      }
    } else {
      for (i = 0; i < template.length; i += 1) {
        if (value[i] === null || value[i]) {
          val.push(fdom.proxy.conform(template[i], value[i]));
        } else {
          val.push(undefined);
        }
      }
    }
    return val;
  } else if (typeof template === 'object') {
    val = {};
    eachProp(template, function(prop, name) {
      if (value[name]) {
        val[name] = fdom.proxy.conform(prop, value[name]);
      }
    });
    return val;
  }
  console.log('Conform ignoring value for template:' + template);
  console.log(value);
};
