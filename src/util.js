
/**
 * Utility method used within the freedom Library.
 * @class util
 * @static
 */
var Util = {};

/**
 * Helper function for iterating over an array backwards. If the func
 * returns a true value, it will break out of the loop.
 * @method eachReverse
 * @static
 */
function eachReverse(ary, func) {
  if (ary) {
    var i;
    for (i = ary.length - 1; i > -1; i -= 1) {
      if (ary[i] && func(ary[i], i, ary)) {
        break;
      }
    }
  }
}

/**
 * @method hasProp
 * @static
 */
function hasProp(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

/**
 * Cycles over properties in an object and calls a function for each
 * property value. If the function returns a truthy value, then the
 * iteration is stopped.
 * @method eachProp
 * @static
 */
function eachProp(obj, func) {
  var prop;
  for (prop in obj) {
    if (obj.hasOwnProperty(prop)) {
      if (func(obj[prop], prop)) {
        break;
      }
    }
  }
}

/**
 * Simple function to mix in properties from source into target,
 * but only if target does not already have a property of the same name.
 * This is not robust in IE for transferring methods that match
 * Object.prototype names, but the uses of mixin here seem unlikely to
 * trigger a problem related to that.
 * @method mixin
 * @static
 */
function mixin(target, source, force) {
  if (source) {
    eachProp(source, function (value, prop) {
      if (force || !hasProp(target, prop)) {
        target[prop] = value;
      }
    });
  }
  return target;
}

/**
 * Add 'on' and 'emit' methods to an object, which act as a light weight
 * event handling structure.
 * @class handleEvents
 * @static
 */
function handleEvents(obj) {
  var eventState = {
    listeners: {},
    conditional: [],
    oneshots: {},
    onceConditional: []
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
    var i;
    if (this.listeners[type]) {
      for (i = 0; i < this.listeners[type].length; i++) {
        if (this.listeners[type][i](data) === false) {
          return;
        }
      }
    }
    if (this.oneshots[type]) {
      for (i = 0; i < this.oneshots[type].length; i++) {
        this.oneshots[type][i](data);
      }
      this.oneshots[type] = [];
    }
    for (i = 0; i < this.conditional.length; i++) {
      if (this.conditional[i][0](type, data)) {
        this.conditional[i][1](data);
      }
    }
    for (i = this.onceConditional.length - 1; i >= 0; i--) {
      if (this.onceConditional[i][0](type, data)) {
        var cond = this.onceConditional.splice(i, 1);
        cond[0][1](data);
      }
    }
  }.bind(eventState);
}

/**
 * When run without a window, or specifically requested.
 * @method isAppContext
 * @for util
 * @static
 */
function isAppContext() {
  return (typeof window === 'undefined');
}

/**
 * Provide a source URL which to generate an AppContext compatible with
 * the current instance of freedom.
 * @method forceAppContext
 * @static
 */
function forceAppContext() {
  var forced = "function " + isAppContext.name + "() { return true; }";
  var source = freedom_src.replace(isAppContext.toString(), forced);
  var blob = new Blob([source], {type: 'text/javascript'});
  return URL.createObjectURL(blob);
}

/**
 * Advertise freedom when running in a priviledged context for registration
 * of context specific providers.
 * @method advertise
 * @static
 */
function advertise() {
  // TODO: Determine a better mechanism that this whitelisting.
  if ((location.protocol === 'chrome-extension:' ||
      location.protocol == 'resource:') &&
      typeof freedomcfg !== "undefined") {
    freedomcfg(fdom.apis.register.bind(fdom.apis));
  }
}

/**
 * Find all scripts on the given page.
 * @method scripts
 * @static
 */
function scripts() {
    return document.getElementsByTagName('script');
}

/**
 * Make a relative URL absolute, based on the current location.
 * @method makeAbsolute
 * @static
 */
function makeAbsolute(url) {
  var base = location.protocol + "//" + location.host + location.pathname;
  return resolvePath(url, base);
}

/**
 * Make frames to replicate freedom isolation without web-workers.
 * iFrame isolation is non-standardized, and access to the DOM within frames
 * means that they are insecure. However, debugging of webworkers is
 * painful enough that this mode of execution can be valuable for debugging.
 * @method makeFrame
 * @static
 */
function makeFrame() {
  var frame = document.createElement('iframe');
  // TODO(willscott): add sandboxing protection.

  var loader = '<html><script src="' + forceAppContext() + '"></script></html>';
  var blob = new Blob([loader], {type: 'text/html'});
  frame.src = URL.createObjectURL(blob);

  if (!document.body) {
    document.appendChild(document.createElement("body"));
  }
  document.body.appendChild(frame);
  return frame.contentWindow;
}

/**
 * Resolve a url against a defined base location.
 * @method resolvePath
 * @static
 */
function resolvePath(url, from) {
  var protocols = ["http", "https", "chrome-extension", "resource"];
  for (var i = 0; i < protocols.length; i++) {
    if (url.indexOf(protocols[i] + "://") === 0) {
      return url;
    }
  }

  var dirname = from.substr(0, from.lastIndexOf("/"));
  var protocolIdx = dirname.indexOf("://");
  var pathIdx = protocolIdx + 3 + dirname.substr(protocolIdx + 3).indexOf("/");
  var path = dirname.substr(pathIdx);
  var base = dirname.substr(0, pathIdx);
  if (url.indexOf("/") === 0) {
    return base + url;
  } else {
    return base + path + "/" + url;
  }
}

