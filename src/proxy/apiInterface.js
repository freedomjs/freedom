/*globals fdom:true, Blob, ArrayBuffer, Promise */
/*jslint indent:2, white:true, node:true, sloppy:true, browser:true */
if (typeof fdom === 'undefined') {
  fdom = {};
}
fdom.proxy = fdom.proxy || {};

fdom.proxy.ApiInterface = function(def, onMsg, emit) {
  var inflight = {},
      events = null,
      emitter = null,
      reqId = 0;

  fdom.util.eachProp(def, function(prop, name) {
    switch(prop.type) {
    case 'method':
      this[name] = function() {
        // Note: inflight should be registered before message is passed
        // in order to prepare for synchronous in-window pipes.
        var thisReq = reqId,
            promise = new Promise(function(resolve, reject) {
              inflight[thisReq] = resolve;
            });
        reqId += 1;
        emit({
          action: 'method',
          type: name,
          reqId: thisReq,
          value: fdom.proxy.conform(prop.value, arguments)
        });
        return promise;
      };
      break;
    case 'event':
      if(!events) {
        fdom.util.handleEvents(this);
        emitter = this.emit;
        delete this.emit;
        events = {};
      }
      events[name] = prop;
      break;
    case 'constant':
      Object.defineProperty(this, name, {
        value: fdom.proxy.recursiveFreezeObject(prop.value),
        writable: false
      });
      break;
    }
  }.bind(this));

  onMsg(this, function(type, msg) {
    if (type === 'close') {
      this.off();
      delete this.inflight;
      return;
    }
    if (!msg) {
      return;
    }
    if (msg.type === 'method') {
      if (inflight[msg.reqId]) {
        var resolve = inflight[msg.reqId];
        delete inflight[msg.reqId];
        resolve(msg.value);
      } else {
        fdom.debug.warn('Dropped response message with id ' + msg.reqId);
      }
    } else if (msg.type === 'event') {
      if (events[msg.name]) {
        emitter(msg.name, fdom.proxy.conform(events[msg.name].value, msg.value));
      }
    }
  }.bind(this));

  emit({
    'type': 'construct'
  });
};

/**
 * Force a collection of values to look like the types and length of an API template.
 */
fdom.proxy.conform = function(template, value) {
  /* jshint -W086 */
  if (typeof(value) === 'function') {
    value = undefined;
  }
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
    if (value instanceof Blob) {
      return value;
    } else {
      fdom.debug.warn('conform expecting Blob, sees ' + (typeof value));
      return new Blob([]);
    }
  case 'buffer':
    if (value instanceof ArrayBuffer) {  
      return value;
    } else {
      fdom.debug.warn('conform expecting ArrayBuffer, sees ' + (typeof value));
      //TODO(ryscheng): bug in Chrome where passing Array Buffers over iframes loses this
      return new ArrayBuffer(0);
    }
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
    fdom.util.eachProp(template, function(prop, name) {
      if (value[name]) {
        val[name] = fdom.proxy.conform(prop, value[name]);
      }
    });
    return val;
  }
  fdom.debug.log('Conform ignoring value for template:' + template);
  fdom.debug.log(value);
};

/**
 * Recursively traverse a [nested] object and freeze its keys from being writable.
 * Note, the result can have new keys added to it, but existing ones cannot be overwritten.
 * Doesn't do anything for arrays or other collections.
 * 
 * @method recursiveFreezeObject
 * @static
 * @param {Object} obj - object to be frozen
 * @return {Object} obj
 **/
fdom.proxy.recursiveFreezeObject = function(obj) {
  var k, ret = {};
  if (typeof obj !== 'object') {
    return obj;
  }
  for (k in obj) {
    if (obj.hasOwnProperty(k)) {
      Object.defineProperty(ret, k, {
        value: fdom.proxy.recursiveFreezeObject(obj[k]),
        writable: false
      });
    }
  }
  return ret;
};
