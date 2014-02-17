/*globals fdom:true, XMLHttpRequest, crypto */
/*jslint indent:2,white:true,node:true,sloppy:true */
if (typeof fdom === 'undefined') {
  fdom = {};
}

/**
 * Utility method used within the freedom Library.
 * @class util
 * @static
 */
fdom.util = {};


/**
 * Helper function for iterating over an array backwards. If the func
 * returns a true value, it will break out of the loop.
 * @method eachReverse
 * @static
 */
fdom.util.eachReverse = function(ary, func) {
  if (ary) {
    var i;
    for (i = ary.length - 1; i > -1; i -= 1) {
      if (ary[i] && func(ary[i], i, ary)) {
        break;
      }
    }
  }
};

/**
 * @method hasProp
 * @static
 */
fdom.util.hasProp = function(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
};

/**
 * Cycles over properties in an object and calls a function for each
 * property value. If the function returns a truthy value, then the
 * iteration is stopped.
 * @method eachProp
 * @static
 */
fdom.util.eachProp = function(obj, func) {
  var prop;
  for (prop in obj) {
    if (obj.hasOwnProperty(prop)) {
      if (func(obj[prop], prop)) {
        break;
      }
    }
  }
};

/**
 * Simple function to mix in properties from source into target,
 * but only if target does not already have a property of the same name.
 * This is not robust in IE for transferring methods that match
 * Object.prototype names, but the uses of mixin here seem unlikely to
 * trigger a problem related to that.
 * @method mixin
 * @static
 */
fdom.util.mixin = function(target, source, force) {
  if (source) {
    fdom.util.eachProp(source, function (value, prop) {
      if (force || !fdom.util.hasProp(target, prop)) {
        target[prop] = value;
      }
    });
  }
  return target;
};

/**
 * Get a unique ID.
 * @method getId
 * @static
 */
fdom.util.getId = function() {
  var guid = 'guid',
      domain = 12,
      buffer;
  if (typeof crypto === 'object') {
    buffer = new Uint8Array(domain);
    crypto.getRandomValues(buffer);
    fdom.util.eachReverse(buffer, function(n) {
      guid += '-' + n;
    });
  } else {
    while (domain > 0) {
      guid += '-' + Math.ceil(255 * Math.random());
      domain -= 1;
    }
  }

  return guid;
};

/**
 * Add 'on' and 'emit' methods to an object, which act as a light weight
 * event handling structure.
 * @class handleEvents
 * @static
 */
fdom.util.handleEvents = function(obj) {
  var eventState = {
    listeners: {},
    conditional: [],
    oneshots: {},
    onceConditional: []
  };

  /**
   * Filter a list based on a predicate. The list is filtered in place, with
   * selected items removed and returned by the function.
   * @method
   * @param {Array} list The list to filter
   * @param {Function} predicate The method to run on each item.
   * @returns {Array} Selected items
   */
  var filter = function(list, predicate) {
    var ret = [], i;

    if (!list || !list.length) {
      return [];
    }

    for (i = list.length - 1; i >= 0; i -= 1) {
      if (predicate(list[i])) {
        ret.push(list.splice(i, 1));
      }
    }
    return ret;
  };

  /**
   * Register a method to be executed when an event of a specific type occurs.
   * @method on
   * @param {String|Function} type The type of event to register against.
   * @param {Function} handler The handler to run when the event occurs.
   */
  obj['on'] = function(type, handler) {
    if (typeof type === 'function') {
      this.conditional.push([type, handler]);
    } else if (this.listeners[type]) {
      this.listeners[type].push(handler);
    } else {
      this.listeners[type] = [handler];
    }
  }.bind(eventState);

  /**
   * Register a method to be execute the next time an event occurs.
   * @method once
   * @param {String|Function} type The type of event to wait for.
   * @param {Function} handler The handler to run the next time a matching event
   *     is raised.
   */
  obj['once'] = function(type, handler) {
    if (typeof type === 'function') {
      this.onceConditional.push([type, handler]);
    } else if (this.oneshots[type]) {
      this.oneshots[type].push(handler);
    } else {
      this.oneshots[type] = [handler];
    }
  }.bind(eventState);

  /**
   * Emit an event on this object.
   * @method emit
   * @param {String} type The type of event to raise.
   * @param {Object} data The payload of the event.
   */
  obj['emit'] = function(type, data) {
    var i, queue;
    if (this.listeners[type]) {
      for (i = 0; i < this.listeners[type].length; i += 1) {
        if (this.listeners[type][i](data) === false) {
          return;
        }
      }
    }
    if (this.oneshots[type]) {
      queue = this.oneshots[type];
      this.oneshots[type] = [];
      for (i = 0; i < queue.length; i += 1) {
        queue[i](data);
      }
    }
    for (i = 0; i < this.conditional.length; i += 1) {
      if (this.conditional[i][0](type, data)) {
        this.conditional[i][1](data);
      }
    }
    for (i = this.onceConditional.length - 1; i >= 0; i -= 1) {
      if (this.onceConditional[i][0](type, data)) {
        queue = this.onceConditional.splice(i, 1);
        queue[0][1](data);
      }
    }
  }.bind(eventState);

  /**
   * Remove an event handler
   * @method off
   * @param {String} type The type of event to remove.
   * @param {Function?} handler The handler to remove.
   */
  obj['off'] = function(type, handler) {
    var i;
    if (!type) {
      this.listeners = {};
      this.conditional = [];
      this.oneshots = {};
      this.onceConditional = [];
      return;
    }

    if (typeof type === 'function') {
      filter(this.onceConditional, function(item) {
        return item[0] === type && (!handler || item[1] === handler);
      });
      filter(this.conditional, function(item) {
        return item[0] === type && (!handler || item[1] === handler);
      });
    }

    if (!handler) {
      delete this.listeners[type];
      delete this.oneshots[type];
    } else {
      filter(this.listeners[type], function(item) {
        return item === handler;
      });
      filter(this.oneshots[type], function(item) {
        return item === handler;
      });
    }
  }.bind(eventState);
};

/**
 * When run without a window, or specifically requested.
 * Note: Declaration can be redefined in forceAppContext below.
 * @method isAppContext
 * @for util
 * @static
 */
fdom.util.isAppContext=function() {
  return (typeof document === 'undefined');
};

/**
 * Provide a version of src where the 'isAppContext' function will return true.
 * Used for creating app contexts which may not be able to determine that they
 * need to start up as applications by themselves.
 * @method forceAppContext
 * @static
 */
fdom.util.forceAppContext = function(src) {
  var declaration = fdom.util.isAppContext.name + "=function()",
      definition = " { return true; }",
      idx = src.indexOf(declaration),
      source,
      blob;
  if (idx === -1) {
    fdom.debug.warn('Unable to force App Context, source is in unexpected condition.');
    return;
  }
  source = src.substr(0, idx + declaration.length) + definition +
      '|| function()' +
      src.substr(idx + declaration.length);
  blob = fdom.util.getBlob(source, 'text/javascript');
  return fdom.util.getURL(blob);
};

/**
 * Get a Blob object of a string.
 * Polyfills implementations which don't have a current Blob constructor, like
 * phantomjs.
 * @method getBlob
 * @static
 */
fdom.util.getBlob = function(data, type) {
  if (typeof Blob !== 'function' && typeof WebKitBlobBuilder !== 'undefined') {
    var builder = new WebKitBlobBuilder();
    builder.append(data);
    return builder.getBlob(type);
  } else {
    return new Blob([data], {type: type});
  }
};

/**
 * Get a URL of a blob object for inclusion in a frame.
 * Polyfills implementations which don't have a current URL object, like
 * phantomjs.
 * @method getURL
 * @static
 */
fdom.util.getURL = function(blob) {
  if (typeof URL !== 'object' && typeof webkitURL !== 'undefined') {
    return webkitURL.createObjectURL(blob);
  } else {
    return URL.createObjectURL(blob);
  }
};

/**
 * When running in a priviledged context, honor a global
 * 'freedomcfg' function to allow registration of additional API providers.
 * @method advertise
 * @param {Boolean} force Advertise even if not in a priviledged context.
 * @static
 */
fdom.util.advertise = function(force) {
  // TODO: Determine a better mechanism than this whitelisting.
  if (typeof location !== 'undefined') {
    if ((location.protocol === 'chrome-extension:' ||
        location.protocol === 'chrome:' ||
        location.protocol == 'resource:' || force) &&
        typeof freedomcfg !== "undefined") {
      freedomcfg(fdom.apis.register.bind(fdom.apis));
    }
  } else if (force && typeof freedomcfg !== "undefined") {
    freedomcfg(fdom.apis.register.bind(fdom.apis));
  }
};

/**
 * Find all scripts on the given page.
 * @method scripts
 * @static
 */
fdom.util.scripts = function(global) {
  return global.document.getElementsByTagName('script');
};
