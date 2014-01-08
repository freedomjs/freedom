/*globals fdom:true, handleEvents, eachProp, Blob, ArrayBuffer */
/*jslint indent:2, white:true, node:true, sloppy:true, browser:true */
if (typeof fdom === 'undefined') {
  fdom = {};
}
fdom.proxy = fdom.proxy || {};

/**
 * Note: this follows the structure of jQuery deferred
 * https://github.com/jquery/jquery/blob/master/src/deferred.js
 */

fdom.proxy.Callbacks = function(multiple) {
  var memory, fired, firing, firingStart, firingLength, firingIndex,
      stack = multiple && [],
      list = [],
      fire = function(data) {
    memory = data;
    fired = true;
    firingIndex = firingStart || 0;
    firingStart = 0;
    firingLength = list.length;
    firing = true;
    for (list; list && firingIndex < firingLength; firingIndex += 1) {
      list[firingIndex].apply(data[0], data[1]);
    }
    firing = false;
    if (list) {
      if (stack && stack.length) {
        fire(stack.shift());
      } else if (!stack) {
        list = [];
      }
    }
  },
  self = {
    add: function() {
      if (list) {
        var start = list.length;
        (function add(args) {
          var i;
          for (i = 0; i < args.length; i += 1) {
            if (typeof args[i] === 'function') {
              if (!self.has(args[i])) {
                list.push(args[i]);
              }
            } else if (args[i] && args[i].length && typeof args[i] !== 'string') {
              add(args[i]);
            }
          }
        })(arguments);
        if (firing) {
          firingLength = list.length;
        } else if (memory) {
          firingStart = start;
          fire(memory);
        }
      }
      return this;
    },
    remove: function() {
      var i, idx;
      if (list) {
        for (i = 0; i < arguments.length; i += 1) {
          while ((idx = list.indexOf(arguments[i], idx)) > -1) {
            list.splice(idx, 1);
            if (firing) {
              if (idx <= firingLength) {
                firingLength -= 1;
              }
              if (idx <= firingIndex) {
                firingIndex -= 1;
              }
            }
          }
        }
      }
      return this;
    },
    has: function(fn) {
      return fn ? list.indexOf(fn) > -1 : !!(list && list.length);
    },
    empty: function() {
      list = [];
      return this;
    },
    disable: function() {
      list = stack = memory = undefined;
      return this;
    },
    disabled: function() {
      return !list;
    },
    lock: function() {
      stack = undefined;
      return this;
    },
    locked: function() {
      return !stack;
    },
    fireWith: function(context, args) {
      args = args || [];
      args = [context, args.slice ? args.slice() : args];
      if (list && (!fired || stack)) {
        if (firing) {
          stack.push(args);
        } else {
          fire(args);
        }
      }
      return this;
    },
    fire: function() {
      self.fireWith(this, arguments);
      return this;
    },
    fired: function() {
      return !!fired;
    }
  };
  return self;
};

fdom.proxy.Deferred = function(func) {
  /* jshint -W083 */
  var events = [
    ["resolve", "done", fdom.proxy.Callbacks(), "resolved"],
    ["reject", "fail", fdom.proxy.Callbacks(), "rejected"],
    ["notify", "progress", fdom.proxy.Callbacks(true)]
  ], 
      deferred = {},
      state = "pending",
      promise = {
    'state': function() {
      return state;
    },
    'always': function() {
      deferred.done(arguments).fail(arguments);
      return this;
    },
    'then': function() {
      var fns = arguments, i;
      return fdom.proxy.Deferred(function(newDefer) {
        for (i = 0; i < events.length; i += 1) {
          var action = events[i][0],
              fn = typeof fns[i] === 'function' ? fns[i] : null;
          deferred[events[i][1]](function(fn, action) {
            var returned = fn && fn.apply(this, Array.prototype.slice.call(arguments, 2));
            if (returned && typeof returned.promise === 'function') {
              returned['promise']()
                .done(newDefer.resolve)
                .fail(newDefer.reject)
                .progress(newDefer.notify);
            } else {
              newDefer[action + "With"](this === promise ? newDefer['promise'](): this, fn ? [returned] : arguments);
            }
          }.bind(this, fn, action));
        }
        fns = null;
      })['promise']();
    },
    'promise': function(obj) {
      return (obj !== null && obj !== undefined) ? mixin(obj, promise) : promise;
    }
  };

  // Add event handlers.
  for (var i = 0; i < events.length; i++) {
    var stateStr = events[i][3];
    var list = events[i][2];

    promise[events[i][1]] = list.add;

    if (stateStr) {
      list.add(function(ss) {
        state = ss;
      }.bind(this, stateStr), events[i ^ 1][2].disable, events[2][2].lock);
    }

    var e = events[i][0];    
    deferred[e] = function(ev) {
      deferred[ev + "With"](this === deferred ? promise : this, Array.prototype.slice.call(arguments, 1));
      return this;
    }.bind(this, e);
    deferred[e + "With"] = list.fireWith;
  }

  promise['promise'](deferred);
  if (func) {
    func.call(deferred, deferred);
  }
  return deferred;
};
