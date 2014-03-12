/*globals fdom:true, Blob, ArrayBuffer, DataView, Promise */
/*jslint indent:2, white:true, node:true, sloppy:true, browser:true */
if (typeof fdom === 'undefined') {
  fdom = {};
}
fdom.proxy = fdom.proxy || {};

fdom.proxy.ApiInterface = function(def, onMsg, emit) {
  var inflight = {},
      events = null,
      emitter = null,
      reqId = 0,
      args = arguments;

  fdom.util.eachProp(def, function(prop, name) {
    switch(prop.type) {
    case 'method':
      this[name] = function() {
        // Note: inflight should be registered before message is passed
        // in order to prepare for synchronous in-window pipes.
        var thisReq = reqId,
            promise = new Promise(function(resolve, reject) {
              inflight[thisReq] = {
                resolve:resolve,
                reject:reject,
                template: prop.ret
              };
            }),
            streams = fdom.proxy.messageToPortable(prop.value, arguments);
        reqId += 1;
        emit({
          action: 'method',
          type: name,
          reqId: thisReq,
          text: streams.text,
          binary: streams.binary
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
        var resolver = inflight[msg.reqId],
            template = resolver.template;
        delete inflight[msg.reqId];
        if (msg.error) {
          resolver.reject(msg.error);
        } else {
          resolver.resolve(fdom.proxy.portableToMessage(template, msg));
        }
      } else {
        fdom.debug.warn('Dropped response message with id ' + msg.reqId);
      }
    } else if (msg.type === 'event') {
      if (events[msg.name]) {
        emitter(msg.name, fdom.proxy.portableToMessage(events[msg.name].value,
                msg));
      }
    }
  }.bind(this));

  args = fdom.proxy.messageToPortable(
      def.constructor ? def.constructor.value : [],
      Array.prototype.slice.call(args, 3));

  emit({
    type: 'construct',
    text: args.text,
    binary: args.binary
  });
};

/**
 * Convert a structured data structure into a message stream conforming to
 * a template and an array of binary data elements.
 * @static
 * @method messageToPortable
 * @param {Object} template The template to conform to
 * @param {Object} value The instance of the data structure to confrom
 * @return {{text: Object, binary: Array}} Separated data streams.
 */
fdom.proxy.messageToPortable = function(template, value) {
  var externals = [],
      message = fdom.proxy.conform(template, value, externals, true);
  return {
    text: message,
    binary: externals
  };
};

/**
 * Convert Structured Data streams into a data structure conforming to a
 * template.
 * @static
 * @method portableToMessage
 * @param {Object} template The template to conform to
 * @param {{text: Object, binary: Array}} streams The streams to conform
 * @return {Object} The data structure matching the template.
 */
fdom.proxy.portableToMessage = function(template, streams) {
  return fdom.proxy.conform(template, streams.text, streams.binary, false);
};

/**
 * Force a collection of values to look like the types and length of an API
 * template.
 * @static
 * @method conform
 * @param {Object} template The template to conform to
 * @param {Object} from The value to conform
 * @param {Array} externals Listing of binary elements in the template
 * @param {Boolean} Whether to to separate or combine streams.
 */
fdom.proxy.conform = function(template, from, externals, separate) {
  /* jshint -W086 */
  if (typeof(from) === 'function') {
    //from = undefined;
    //throw "Trying to conform a function";
    return undefined;
  } else if (typeof(from) === 'undefined' || template === undefined) {
    return undefined;
  } else if (from === null) {
    return null;
  }
  switch(template) {
  case 'string':
    return String('') + from;
  case 'number':
    return Number(1) * from;
  case 'boolean':
    return Boolean(from === true);
  case 'object':
    // TODO(willscott): Allow removal if sandboxing enforces this.
    if (typeof from === 'undefined') {
      return undefined;
    } else {
      return JSON.parse(JSON.stringify(from));
    }
  case 'blob':
    if (separate) {
      if (from instanceof Blob) {
        externals.push(from);
        return externals.length - 1;
      } else {
        fdom.debug.warn('conform expecting Blob, sees ' + (typeof from));
        externals.push(new Blob([]));
        return externals.length - 1;
      }
    } else {
      return externals[from];
    }
  case 'buffer':
    if (separate) {
      externals.push(fdom.proxy.makeArrayBuffer(from));
      return externals.length - 1;
    } else {
      return fdom.proxy.makeArrayBuffer(externals[from]);
    }
  case 'proxy':
    return from;
  }
  var val, i;
  if (Array.isArray(template) && from !== undefined) {
    val = [];
    i = 0;
    if (template.length === 2 && template[0] === 'array') {
      //console.log("template is array, value is " + JSON.stringify(value));
      for (i = 0; i < from.length; i += 1) {
        val.push(fdom.proxy.conform(template[1], from[i], externals,
                                    separate));
      }
    } else {
      for (i = 0; i < template.length; i += 1) {
        if (from[i] !== undefined) {
          val.push(fdom.proxy.conform(template[i], from[i], externals,
                                      separate));
        } else {
          val.push(undefined);
        }
      }
    }
    return val;
  } else if (typeof template === 'object' && from !== undefined) {
    val = {};
    fdom.util.eachProp(template, function(prop, name) {
      if (from[name] !== undefined) {
        val[name] = fdom.proxy.conform(prop, from[name], externals, separate);
      }
    });
    return val;
  }
  fdom.debug.warn('Unknown template type: ' + template);
};

/**
 * Make a thing into an Array Buffer
 * @static
 * @method makeArrayBuffer
 * @param {Object} thing
 * @return {ArrayBuffer} An Array Buffer
 */
fdom.proxy.makeArrayBuffer = function(thing) {
  if (!thing) {
    return new ArrayBuffer(0);
  }

  if (thing instanceof ArrayBuffer) {
    return thing;
  } else if (thing.constructor.name === "ArrayBuffer" &&
      typeof thing.prototype === "undefined") {
    // Workaround for webkit origin ownership issue.
    // https://github.com/UWNetworksLab/freedom/issues/28
    return new DataView(thing).buffer;
  } else {
    fdom.debug.warn('expecting ArrayBuffer, but saw ' +
        (typeof thing) + ': ' + JSON.stringify(thing));
    return new ArrayBuffer(0);
  }
};

/**
 * Recursively traverse a [nested] object and freeze its keys from being
 * writable. Note, the result can have new keys added to it, but existing ones
 * cannot be  overwritten. Doesn't do anything for arrays or other collections.
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
        writable: false,
        enumerable: true
      });
    }
  }
  return ret;
};
