/**
 * Helper function for iterating over an array backwards. If the func
 * returns a true value, it will break out of the loop.
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
 * Cycles over properties in an object and calls a function for each
 * property value. If the function returns a truthy value, then the
 * iteration is stopped.
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
 */
function mixin(target, source, force, deepStringMixin) {
  if (source) {
    eachProp(source, function (value, prop) {
      if (force || !hasProp(target, prop)) {
        if (deepStringMixin && typeof value !== 'string') {
          if (!target[prop]) {
            target[prop] = {};
          }
          mixin(target[prop], value, force, deepStringMixin);
        } else {
          target[prop] = value;
        }
      }
    });
  }
  return target;
}

/**
 * Add 'on' and 'emit' methods to an object, which act as a light weight
 * event handling structure.
 */
function handleEvents(obj) {
  var listeners = {};
  obj['on'] = function(type, handler) {
    if (listeners[type]) {
      listeners[type].push(handler);
    } else {
      listeners[type] = [handler];
    }
  }

  obj['once'] = function(type, handler) {
    var func = function(data) {
      var idx = listeners[type].indexOf(func)
      listeners[type] = listeners[type].splice(idx, 1);
      handler(data);
    }

    obj['on'](type, func);
  }

  obj['emit'] = function(type, data) {
    if (listeners[type]) {
      for (var i = 0; i < listeners[type].length; i++) {
        listeners[type][i](data);
      }
    }
  }
}

/**
 * Find all scripts on the given page.
 */
function scripts() {
    return document.getElementsByTagName('script');
}

/**
 * Make a relative URL absolute, based on the current document location.
 */
function makeAbsolute(rel) {
  var base = document.location.protocol + "//" + document.location.hostname + document.location.pathname;
  var here = base.substr(0, base.lastIndexOf("/"));
  return here + "/" + rel;
}