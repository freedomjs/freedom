(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
var Promise = require("./promise/promise").Promise;
var polyfill = require("./promise/polyfill").polyfill;
exports.Promise = Promise;
exports.polyfill = polyfill;
},{"./promise/polyfill":5,"./promise/promise":6}],2:[function(require,module,exports){
"use strict";
/* global toString */

var isArray = require("./utils").isArray;
var isFunction = require("./utils").isFunction;

/**
  Returns a promise that is fulfilled when all the given promises have been
  fulfilled, or rejected if any of them become rejected. The return promise
  is fulfilled with an array that gives all the values in the order they were
  passed in the `promises` array argument.

  Example:

  ```javascript
  var promise1 = RSVP.resolve(1);
  var promise2 = RSVP.resolve(2);
  var promise3 = RSVP.resolve(3);
  var promises = [ promise1, promise2, promise3 ];

  RSVP.all(promises).then(function(array){
    // The array here would be [ 1, 2, 3 ];
  });
  ```

  If any of the `promises` given to `RSVP.all` are rejected, the first promise
  that is rejected will be given as an argument to the returned promises's
  rejection handler. For example:

  Example:

  ```javascript
  var promise1 = RSVP.resolve(1);
  var promise2 = RSVP.reject(new Error("2"));
  var promise3 = RSVP.reject(new Error("3"));
  var promises = [ promise1, promise2, promise3 ];

  RSVP.all(promises).then(function(array){
    // Code here never runs because there are rejected promises!
  }, function(error) {
    // error.message === "2"
  });
  ```

  @method all
  @for RSVP
  @param {Array} promises
  @param {String} label
  @return {Promise} promise that is fulfilled when all `promises` have been
  fulfilled, or rejected if any of them become rejected.
*/
function all(promises) {
  /*jshint validthis:true */
  var Promise = this;

  if (!isArray(promises)) {
    throw new TypeError('You must pass an array to all.');
  }

  return new Promise(function(resolve, reject) {
    var results = [], remaining = promises.length,
    promise;

    if (remaining === 0) {
      resolve([]);
    }

    function resolver(index) {
      return function(value) {
        resolveAll(index, value);
      };
    }

    function resolveAll(index, value) {
      results[index] = value;
      if (--remaining === 0) {
        resolve(results);
      }
    }

    for (var i = 0; i < promises.length; i++) {
      promise = promises[i];

      if (promise && isFunction(promise.then)) {
        promise.then(resolver(i), reject);
      } else {
        resolveAll(i, promise);
      }
    }
  });
}

exports.all = all;
},{"./utils":10}],3:[function(require,module,exports){
(function (process,global){
"use strict";
var browserGlobal = (typeof window !== 'undefined') ? window : {};
var BrowserMutationObserver = browserGlobal.MutationObserver || browserGlobal.WebKitMutationObserver;
var local = (typeof global !== 'undefined') ? global : (this === undefined? window:this);

// node
function useNextTick() {
  return function() {
    process.nextTick(flush);
  };
}

function useMutationObserver() {
  var iterations = 0;
  var observer = new BrowserMutationObserver(flush);
  var node = document.createTextNode('');
  observer.observe(node, { characterData: true });

  return function() {
    node.data = (iterations = ++iterations % 2);
  };
}

function useSetTimeout() {
  return function() {
    local.setTimeout(flush, 1);
  };
}

var queue = [];
function flush() {
  for (var i = 0; i < queue.length; i++) {
    var tuple = queue[i];
    var callback = tuple[0], arg = tuple[1];
    callback(arg);
  }
  queue = [];
}

var scheduleFlush;

// Decide what async method to use to triggering processing of queued callbacks:
if (typeof process !== 'undefined' && {}.toString.call(process) === '[object process]') {
  scheduleFlush = useNextTick();
} else if (BrowserMutationObserver) {
  scheduleFlush = useMutationObserver();
} else {
  scheduleFlush = useSetTimeout();
}

function asap(callback, arg) {
  var length = queue.push([callback, arg]);
  if (length === 1) {
    // If length is 1, that means that we need to schedule an async flush.
    // If additional callbacks are queued before the queue is flushed, they
    // will be processed by this flush that we are scheduling.
    scheduleFlush();
  }
}

exports.asap = asap;
}).call(this,require("JkpR2F"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"JkpR2F":11}],4:[function(require,module,exports){
"use strict";
var config = {
  instrument: false
};

function configure(name, value) {
  if (arguments.length === 2) {
    config[name] = value;
  } else {
    return config[name];
  }
}

exports.config = config;
exports.configure = configure;
},{}],5:[function(require,module,exports){
(function (global){
"use strict";
/*global self*/
var RSVPPromise = require("./promise").Promise;
var isFunction = require("./utils").isFunction;

function polyfill() {
  var local;

  if (typeof global !== 'undefined') {
    local = global;
  } else if (typeof window !== 'undefined' && window.document) {
    local = window;
  } else {
    local = self;
  }

  var es6PromiseSupport = 
    "Promise" in local &&
    // Some of these methods are missing from
    // Firefox/Chrome experimental implementations
    "resolve" in local.Promise &&
    "reject" in local.Promise &&
    "all" in local.Promise &&
    "race" in local.Promise &&
    // Older version of the spec had a resolver object
    // as the arg rather than a function
    (function() {
      var resolve;
      new local.Promise(function(r) { resolve = r; });
      return isFunction(resolve);
    }());

  if (!es6PromiseSupport) {
    local.Promise = RSVPPromise;
  }
}

exports.polyfill = polyfill;
}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./promise":6,"./utils":10}],6:[function(require,module,exports){
"use strict";
var config = require("./config").config;
var configure = require("./config").configure;
var objectOrFunction = require("./utils").objectOrFunction;
var isFunction = require("./utils").isFunction;
var now = require("./utils").now;
var all = require("./all").all;
var race = require("./race").race;
var staticResolve = require("./resolve").resolve;
var staticReject = require("./reject").reject;
var asap = require("./asap").asap;

var counter = 0;

config.async = asap; // default async is asap;

function Promise(resolver) {
  if (!isFunction(resolver)) {
    throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
  }

  if (!(this instanceof Promise)) {
    throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
  }

  this._subscribers = [];

  invokeResolver(resolver, this);
}

function invokeResolver(resolver, promise) {
  function resolvePromise(value) {
    resolve(promise, value);
  }

  function rejectPromise(reason) {
    reject(promise, reason);
  }

  try {
    resolver(resolvePromise, rejectPromise);
  } catch(e) {
    rejectPromise(e);
  }
}

function invokeCallback(settled, promise, callback, detail) {
  var hasCallback = isFunction(callback),
      value, error, succeeded, failed;

  if (hasCallback) {
    try {
      value = callback(detail);
      succeeded = true;
    } catch(e) {
      failed = true;
      error = e;
    }
  } else {
    value = detail;
    succeeded = true;
  }

  if (handleThenable(promise, value)) {
    return;
  } else if (hasCallback && succeeded) {
    resolve(promise, value);
  } else if (failed) {
    reject(promise, error);
  } else if (settled === FULFILLED) {
    resolve(promise, value);
  } else if (settled === REJECTED) {
    reject(promise, value);
  }
}

var PENDING   = void 0;
var SEALED    = 0;
var FULFILLED = 1;
var REJECTED  = 2;

function subscribe(parent, child, onFulfillment, onRejection) {
  var subscribers = parent._subscribers;
  var length = subscribers.length;

  subscribers[length] = child;
  subscribers[length + FULFILLED] = onFulfillment;
  subscribers[length + REJECTED]  = onRejection;
}

function publish(promise, settled) {
  var child, callback, subscribers = promise._subscribers, detail = promise._detail;

  for (var i = 0; i < subscribers.length; i += 3) {
    child = subscribers[i];
    callback = subscribers[i + settled];

    invokeCallback(settled, child, callback, detail);
  }

  promise._subscribers = null;
}

Promise.prototype = {
  constructor: Promise,

  _state: undefined,
  _detail: undefined,
  _subscribers: undefined,

  then: function(onFulfillment, onRejection) {
    var promise = this;

    var thenPromise = new this.constructor(function() {});

    if (this._state) {
      var callbacks = arguments;
      config.async(function invokePromiseCallback() {
        invokeCallback(promise._state, thenPromise, callbacks[promise._state - 1], promise._detail);
      });
    } else {
      subscribe(this, thenPromise, onFulfillment, onRejection);
    }

    return thenPromise;
  },

  'catch': function(onRejection) {
    return this.then(null, onRejection);
  }
};

Promise.all = all;
Promise.race = race;
Promise.resolve = staticResolve;
Promise.reject = staticReject;

function handleThenable(promise, value) {
  var then = null,
  resolved;

  try {
    if (promise === value) {
      throw new TypeError("A promises callback cannot return that same promise.");
    }

    if (objectOrFunction(value)) {
      then = value.then;

      if (isFunction(then)) {
        then.call(value, function(val) {
          if (resolved) { return true; }
          resolved = true;

          if (value !== val) {
            resolve(promise, val);
          } else {
            fulfill(promise, val);
          }
        }, function(val) {
          if (resolved) { return true; }
          resolved = true;

          reject(promise, val);
        });

        return true;
      }
    }
  } catch (error) {
    if (resolved) { return true; }
    reject(promise, error);
    return true;
  }

  return false;
}

function resolve(promise, value) {
  if (promise === value) {
    fulfill(promise, value);
  } else if (!handleThenable(promise, value)) {
    fulfill(promise, value);
  }
}

function fulfill(promise, value) {
  if (promise._state !== PENDING) { return; }
  promise._state = SEALED;
  promise._detail = value;

  config.async(publishFulfillment, promise);
}

function reject(promise, reason) {
  if (promise._state !== PENDING) { return; }
  promise._state = SEALED;
  promise._detail = reason;

  config.async(publishRejection, promise);
}

function publishFulfillment(promise) {
  publish(promise, promise._state = FULFILLED);
}

function publishRejection(promise) {
  publish(promise, promise._state = REJECTED);
}

exports.Promise = Promise;
},{"./all":2,"./asap":3,"./config":4,"./race":7,"./reject":8,"./resolve":9,"./utils":10}],7:[function(require,module,exports){
"use strict";
/* global toString */
var isArray = require("./utils").isArray;

/**
  `RSVP.race` allows you to watch a series of promises and act as soon as the
  first promise given to the `promises` argument fulfills or rejects.

  Example:

  ```javascript
  var promise1 = new RSVP.Promise(function(resolve, reject){
    setTimeout(function(){
      resolve("promise 1");
    }, 200);
  });

  var promise2 = new RSVP.Promise(function(resolve, reject){
    setTimeout(function(){
      resolve("promise 2");
    }, 100);
  });

  RSVP.race([promise1, promise2]).then(function(result){
    // result === "promise 2" because it was resolved before promise1
    // was resolved.
  });
  ```

  `RSVP.race` is deterministic in that only the state of the first completed
  promise matters. For example, even if other promises given to the `promises`
  array argument are resolved, but the first completed promise has become
  rejected before the other promises became fulfilled, the returned promise
  will become rejected:

  ```javascript
  var promise1 = new RSVP.Promise(function(resolve, reject){
    setTimeout(function(){
      resolve("promise 1");
    }, 200);
  });

  var promise2 = new RSVP.Promise(function(resolve, reject){
    setTimeout(function(){
      reject(new Error("promise 2"));
    }, 100);
  });

  RSVP.race([promise1, promise2]).then(function(result){
    // Code here never runs because there are rejected promises!
  }, function(reason){
    // reason.message === "promise2" because promise 2 became rejected before
    // promise 1 became fulfilled
  });
  ```

  @method race
  @for RSVP
  @param {Array} promises array of promises to observe
  @param {String} label optional string for describing the promise returned.
  Useful for tooling.
  @return {Promise} a promise that becomes fulfilled with the value the first
  completed promises is resolved with if the first completed promise was
  fulfilled, or rejected with the reason that the first completed promise
  was rejected with.
*/
function race(promises) {
  /*jshint validthis:true */
  var Promise = this;

  if (!isArray(promises)) {
    throw new TypeError('You must pass an array to race.');
  }
  return new Promise(function(resolve, reject) {
    var results = [], promise;

    for (var i = 0; i < promises.length; i++) {
      promise = promises[i];

      if (promise && typeof promise.then === 'function') {
        promise.then(resolve, reject);
      } else {
        resolve(promise);
      }
    }
  });
}

exports.race = race;
},{"./utils":10}],8:[function(require,module,exports){
"use strict";
/**
  `RSVP.reject` returns a promise that will become rejected with the passed
  `reason`. `RSVP.reject` is essentially shorthand for the following:

  ```javascript
  var promise = new RSVP.Promise(function(resolve, reject){
    reject(new Error('WHOOPS'));
  });

  promise.then(function(value){
    // Code here doesn't run because the promise is rejected!
  }, function(reason){
    // reason.message === 'WHOOPS'
  });
  ```

  Instead of writing the above, your code now simply becomes the following:

  ```javascript
  var promise = RSVP.reject(new Error('WHOOPS'));

  promise.then(function(value){
    // Code here doesn't run because the promise is rejected!
  }, function(reason){
    // reason.message === 'WHOOPS'
  });
  ```

  @method reject
  @for RSVP
  @param {Any} reason value that the returned promise will be rejected with.
  @param {String} label optional string for identifying the returned promise.
  Useful for tooling.
  @return {Promise} a promise that will become rejected with the given
  `reason`.
*/
function reject(reason) {
  /*jshint validthis:true */
  var Promise = this;

  return new Promise(function (resolve, reject) {
    reject(reason);
  });
}

exports.reject = reject;
},{}],9:[function(require,module,exports){
"use strict";
function resolve(value) {
  /*jshint validthis:true */
  if (value && typeof value === 'object' && value.constructor === this) {
    return value;
  }

  var Promise = this;

  return new Promise(function(resolve) {
    resolve(value);
  });
}

exports.resolve = resolve;
},{}],10:[function(require,module,exports){
"use strict";
function objectOrFunction(x) {
  return isFunction(x) || (typeof x === "object" && x !== null);
}

function isFunction(x) {
  return typeof x === "function";
}

function isArray(x) {
  return Object.prototype.toString.call(x) === "[object Array]";
}

// Date.now is not available in browsers < IE9
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/now#Compatibility
var now = Date.now || function() { return new Date().getTime(); };


exports.objectOrFunction = objectOrFunction;
exports.isFunction = isFunction;
exports.isArray = isArray;
exports.now = now;
},{}],11:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],12:[function(require,module,exports){
var Api = require('../../src/api');

describe("Api", function() {
  var api;

  beforeEach(function() {
    api = new Api();
  });

  it("should return registered providers", function() {
    var provider = {id: "test"};
    api.set('customName', provider);
    expect(api.get('customName').definition).toEqual(provider);
    expect(api.get('customName').name).toEqual('customName');
    expect(api.get('otherName')).toBeFalsy();
  });

  it("should not allow core providers without an API.", function(done) {
    var provider = function() {};

    api.register('customCore', provider);
    var channel = api.getCore('customCore', null);
    channel.then(function() {}, function() {
      done();
    });
  });

  it("should register core providers", function(done) {
    var provider = function(arg) { this.arg = arg };

    api.set('customCore', provider);
    api.register('customCore', provider);
    var channel = api.getCore('customCore', 12);
    channel.then(function(prov) {
      var obj = new prov();
      expect(obj.arg).toEqual(12);
      done();
    });
  });
  
  it("should register core providers in promise style", function(done) {
    var provider = function(arg) { this.arg = arg };

    api.set('customCore', provider);
    api.register('customCore', provider, 'providePromises');
    var channel = api.getCore('customCore', 12);
    channel.then(function(prov) {
      var obj = new prov();
      expect(api.getInterfaceStyle('customCore')).toEqual('providePromises');
      expect(obj.arg).toEqual(12);
      done();
    });
  });

  it("allows late registration of core providers", function(done) {
    var provider = function(arg) { this.arg = arg };

    api.set('customCore', provider);
    var channel = api.getCore('customCore', 12);

    var arg = 0;
    channel.then(function(prov) {
      var mine = new prov();
      arg = mine.arg;
      expect(arg).toEqual(12);
      done();
    });

    expect(arg).toEqual(0);
    
    api.register('customCore', provider);
  });
});

},{"../../src/api":24}],13:[function(require,module,exports){
var Debug = require('../../src/debug.js');

describe("Debug", function() {
  var debug, activeLogger, onLogger;
  var Logger = function() {
    activeLogger = this;
    this.spy = jasmine.createSpy('log');
    this.log = function() {
      this.spy(arguments[0], arguments[1]);
      onLogger();
    };
    this.warn = function() {
      this.spy(arguments[0], arguments[1]);
      onLogger();
    };
  };

  beforeEach(function() {
    debug = new Debug();
  });

  it("Relays Messages", function() {
    var spy = jasmine.createSpy('cb');
    debug.on('msg', spy);

    debug.log('test1');
    debug.warn('test2');
    debug.error('test3');
    debug.format('log', 'source', 'message');
    expect(spy).not.toHaveBeenCalled();

    debug.onMessage('control', {
      channel: 'msg',
      config: {
        debug: true,
        global: {}
      }
    });

    expect(spy).toHaveBeenCalled();
    expect(spy.calls.count()).toEqual(4);
  });

  it("Prints to a provider", function(done) {
    var log = new Logger();
    debug.setLogger(log);

    var msg = {
      severity: 'log',
      source: null,
      msg: JSON.stringify(["My Message"])
    }

    onLogger = function() {
      expect(activeLogger.log).toBeDefined();
      expect(activeLogger.spy).toHaveBeenCalledWith(null, ["My Message"]);
      done();
      onLogger = function() {};
    };

    debug.print(msg);
});
});

},{"../../src/debug.js":25}],14:[function(require,module,exports){
var Hub = require('../../src/hub');
var Debug = require('../../src/debug');

describe("Hub", function() {
  var hub, debug;

  beforeEach(function() {
    debug = new Debug();
    hub = new Hub(debug);
  });

  it("routes messages", function() {
    var app = {
      id: 'testApp'
    };
    hub.register(app);
    app.onMessage = jasmine.createSpy('cb');
    var route = hub.install(app, 'testApp', 'test');
    
    var msg = {test: true};
    hub.onMessage(route, msg);

    expect(app.onMessage).toHaveBeenCalledWith('test', msg);
  });

  it("requires registration", function() {
    var app = {
      id: 'testApp'
    };
    spyOn(debug, 'warn');
    hub.install(app, null, 'magic');
    expect(debug.warn).toHaveBeenCalled();

    hub.register(app);
    hub.install(app, null, 'magic');
    expect(debug.warn.calls.count()).toEqual(2);
    expect(hub.register(app)).toEqual(false);

    expect(hub.deregister(app)).toEqual(true);
    expect(hub.deregister(app)).toEqual(false);
  });

  it("goes between apps", function() {
    var app1 = {
      id: 'testApp'
    };
    var app2 = {
      id: 'otherApp'
    };
    hub.register(app1);
    hub.register(app2);
    app2.onMessage = jasmine.createSpy('cb');
    var route = hub.install(app1, 'otherApp', 'testx');
    
    var msg = {test: true};
    hub.onMessage(route, msg);

    expect(app2.onMessage).toHaveBeenCalledWith('testx', msg);
  });

  it("alerts if messages are sent improperly", function() {
    var app = {
      id: 'testApp'
    };
    hub.register(app);
    app.onMessage = jasmine.createSpy('cb');

    spyOn(debug, 'warn');
    
    hub.onMessage('test', "testing");

    expect(app.onMessage).not.toHaveBeenCalled();
    expect(debug.warn).toHaveBeenCalled();
  });

  it("removes routes", function() {
    spyOn(debug, 'warn');
    var app1 = {
      id: 'testApp'
    };
    var app2 = {
      id: 'otherApp'
    };
    hub.register(app1);
    hub.register(app2);
    app2.onMessage = jasmine.createSpy('cb');
    var route = hub.install(app1, 'otherApp', 'testx');
    
    var msg = {test: true};
    hub.onMessage(route, msg);

    expect(app2.onMessage).toHaveBeenCalledWith('testx', msg);

    hub.uninstall(app1, route);

    expect(debug.warn).not.toHaveBeenCalled();

    hub.onMessage(route, msg);
    expect(debug.warn).toHaveBeenCalled();
  });

  it("Handles failures when removing routes", function() {
    spyOn(debug, 'warn');
    var app1 = {
      id: 'testApp'
    };
    var app2 = {
      id: 'otherApp'
    };
    hub.register(app1);
    hub.register(app2);
    app2.onMessage = jasmine.createSpy('cb');
    var route = hub.install(app1, 'otherApp', 'testx');
    
    hub.uninstall(app2, route);
    expect(debug.warn).toHaveBeenCalled();

    hub.uninstall({id: null}, route);
    expect(debug.warn.calls.count()).toEqual(2);

    expect(hub.uninstall(app1, route+'fake')).toEqual(false);

    hub.deregister(app2);
    expect(hub.getDestination(route)).toEqual(undefined);
    expect(hub.getDestination(route+'fake')).toEqual(null);

    hub.onMessage(route, {test: true});
    expect(debug.warn.calls.count()).toEqual(3);
  });
});


},{"../../src/debug":25,"../../src/hub":26}],15:[function(require,module,exports){
var Debug = require('../../src/debug');
var Hub = require('../../src/hub');
var Manager = require('../../src/manager');
var Resource = require('../../src/resource');
var Api = require('../../src/api');

var testUtil = require('../util');

describe("Manager", function() {
  var debug, hub, manager, port, resource, api;

  beforeEach(function() {
    debug = new Debug();
    hub = new Hub(debug);
    resource = new Resource(debug);
    api = new Api(debug);
    api.set('core',{});
    api.register('core',function() {});
    manager = new Manager(hub, resource, api);
    var global = {};

    hub.emit('config', {
      global: global,
      debug: true
    });
    port = testUtil.createTestPort('testing');
    manager.setup(port);
  });

  it("Handles Debug Messages", function() {
    spyOn(debug, 'print');
    manager.onMessage('testing', {
      request: 'debug'
    });
    expect(debug.print).toHaveBeenCalled();
    manager.onMessage('unregistered', {
      request: 'debug'
    });
    expect(debug.print.calls.count()).toEqual(1);
  });

  it("Creates Links", function() {
    var testPort = testUtil.createTestPort('dest');

    manager.onMessage('testing', {
      request: 'link',
      name: 'testLink',
      to: testPort
    });
    // Setup message.
    expect(testPort.gotMessage('control')).not.toEqual(false);
    // Notification of link.
    var notification = port.gotMessage('control', {type: 'createLink'});
    expect(notification).not.toEqual(false);

    // Forward link is 'default'.
    var msg = {contents: "hi!"};
    port.emit(notification.channel, msg);
    expect(testPort.gotMessage('default')).toEqual(msg);

    // Backwards link should be 'testLink'.
    testPort.emit(notification.reverse, msg);
    expect(port.gotMessage('testLink')).toEqual(msg);
  });

  it("Supports delegation of control", function() {
    var testPort = testUtil.createTestPort('dest');

    manager.setup(testPort);

    // Delegate messages from the new port to our port.
    manager.onMessage('testing', {
      request: 'delegate',
      flow: 'dest'
    });

    // Send a message from the new port.
    manager.onMessage('dest', {
      contents: 'hi!'
    });

    var notification = port.gotMessage('control', {type: 'Delegation'});
    expect(notification).not.toEqual(false);
    expect(notification.flow).toEqual('dest');
    expect(notification.message.contents).toEqual('hi!');
  });

  it("Registers resource resolvers", function() {
    manager.onMessage('testing', {
      request: 'resource',
      service: 'testing',
      args: ['retriever', 'resolver']
    });
    expect(resource.contentRetrievers['testing']).toEqual('resolver');
  });

  it("Provides singleton access to the Core API", function(done) {
    manager.onMessage('testing', {
      request: 'core'
    });
    port.gotMessageAsync('control', {type: 'core'}, function(response) {
      expect(response).not.toEqual(false);
      var core = response.core;

      var otherPort = testUtil.createTestPort('dest');
      manager.setup(otherPort);
      manager.onMessage('dest', {
        request: 'core'
      });
      
      otherPort.gotMessageAsync('control', {type: 'core'}, function(otherResponse) {
        expect(otherResponse.core).toEqual(core);
        done();
      });
    });
  });

  it("Tears down Ports", function() {
    manager.onMessage('testing', {
      request: 'close'
    });

    // Subsequent requests should fail / cause a warning.
    spyOn(debug, 'warn');
    manager.onMessage('testing', {
      request: 'core'
    });
    expect(debug.warn).toHaveBeenCalled();
    expect(port.gotMessage('control', {type: 'core'})).toEqual(false);
  });

  it("Retreives Ports by ID", function() {
    expect(manager.getPort(port.id)).toEqual(port);
  });
});

},{"../../src/api":24,"../../src/debug":25,"../../src/hub":26,"../../src/manager":27,"../../src/resource":38,"../util":23}],16:[function(require,module,exports){
var Api = require('../../src/api');
var Debug = require('../../src/debug');
var Hub = require('../../src/hub');
var Manager = require('../../src/manager');
var ModuleInternal = require('../../src/moduleInternal');

var testUtil = require('../util');

describe('ModuleInternal', function() {
  var app, manager, hub, global, loc;
  beforeEach(function() {
    global = {freedom: {}};
    hub = new Hub(new Debug());
    var resource = testUtil.setupResolvers();
    var api = new Api();
    api.set('core', {});
    api.register('core', function () {});
    manager = new Manager(hub, resource, api);
    app = new ModuleInternal(manager);
    hub.emit('config', {
      global: global,
      location: 'relative://'
    });
    manager.setup(app);

    var path = window.location.href,
        dir_idx = path.lastIndexOf('/');
    loc = path.substr(0, dir_idx) + '/';
});

  it('configures an app environment', function() {
    var source = testUtil.createTestPort('test');
    manager.setup(source);
    manager.createLink(source, 'default', app, 'default');

    hub.onMessage(source.messages[1][1].channel, {
      channel: source.messages[1][1].reverse,
      appId: 'testApp',
      lineage: ['global', 'testApp'],
      manifest: {
        app: {
          script: 'helper/channel.js'
        },
        permissions: ['core.echo'],
        dependencies: ['helper/friend.json'],
        provides: ['identity']
      },
      id: 'relative://spec/helper/manifest.json',
    });

    expect(source.gotMessage('control', {'name': 'identity'})).toBeDefined();
    expect(source.gotMessage('control', {'name': 'core.echo'})).toBeDefined();
  });

  it('handles script loading and attachment', function(done) {
    global.document = document;
    
    var script = btoa('fileIncluded = true; callback();');

    window.callback = function() {
      expect(fileIncluded).toEqual(true);
      delete callback;
      done();
    } 
    
    app.loadScripts(loc, ['data:text/javascript;base64,' + script, 'non_existing_file']);
  });

  it('load scripts sequentially', function(done) {
    global.document = document;

    fileIncluded = false;
    fileIncluded0 = false;

    var script0 = btoa('fileIncluded0 = true; callback0();');
    window.callback0 = function() {
      expect(fileIncluded0).toEqual(true);
      expect(fileIncluded).toEqual(false);
      delete callback0;
    };

    var script = btoa('fileIncluded = true; callback();');
    window.callback = function() {
      expect(fileIncluded0).toEqual(true);
      expect(fileIncluded).toEqual(true);
      delete callback;
      done();
    };

    app.loadScripts(loc, ['data:text/javascript;base64,' + script0,
                          'data:text/javascript;base64,' + script,
                          'non_existing_file']);
  })

  iit('exposes dependency apis', function(done) {
    var source = testUtil.createTestPort('test');
    manager.setup(source);
    manager.createLink(source, 'default', app, 'default');
    source.on('onMessage', function(msg) {
      // Dependencies will be requested via 'createLink' messages. resolve those.
      if (msg.channel && msg.type === 'createLink') {
        hub.onMessage(msg.channel, {
          type: 'channel announcement',
          channel: msg.reverse
        });
      } else if (msg.type === 'resolve') {
        hub.onMessage(source.messages[1][1].channel, {
          id: msg.id,
          data: 'spec/' + msg.data
        });
      } else {
        console.warn('unknown msg', msg);
      }
    });

    global.document = document;

    hub.onMessage(source.messages[1][1].channel, {
      channel: source.messages[1][1].reverse,
      appId: 'testApp',
      lineage: ['global', 'testApp'],
      manifest: {
        name: 'My Module Name',
        app: {
          script: 'helper/beacon.js'
        },
        dependencies: {
          "test": {
            "url": "relative://spec/helper/friend.json",
            "api": "social"
          }
        }
      },
      id: 'relative://spec/helper/manifest.json',
    });
    hub.onMessage(source.messages[1][1].channel, {
      type: 'manifest',
      name: 'test',
      manifest: {name: 'test manifest'}
    });

    window.callback = function() {
      delete callback;
      expect(global.freedom.manifest.name).toEqual('My Module Name');
      expect(global.freedom.test.api).toEqual('social');
      expect(global.freedom.test.manifest.name).toEqual('test manifest');
      done();
    };
  });
});

},{"../../src/api":24,"../../src/debug":25,"../../src/hub":26,"../../src/manager":27,"../../src/moduleInternal":29,"../util":23}],17:[function(require,module,exports){
var Debug = require('../../src/debug');
var Policy = require('../../src/policy');
var Resource = require('../../src/resource');
var util = require('../../src/util');

describe('Policy', function() {
  var policy,
      manager;
  beforeEach(function() {
    manager = {debug: new Debug()};
    util.handleEvents(manager);
    manager.getPort = function(id) {
      return {
        id: id
      };
    };
    var rsrc = new Resource();
    policy = new Policy(manager, rsrc, {});
  });
  
  it('Generates new modules when needed', function(done) {
    var manifest = {
      constraints: {
        isolation: "never"
      }
    };
    var manifestURL = "manifest://" + JSON.stringify(manifest);
    policy.get([], manifestURL).then(function(mod) {
      manager.emit('moduleAdd', {lineage:[mod.id], id:mod.id});
      policy.get([], manifestURL).then(function(mod2) {
        expect(mod2.id).toEqual(mod.id);
        done();
      });
    });
  });
  
  xit('Finds an appropriate runtime to place new modules', function() {
    //TODO: need to understand actual policy for multiple runtimes better.
  });
  
  it('Detects if a module is running in a runtime', function() {
    manager.emit('moduleAdd', {lineage:['test','a','b','c'], id:'test1'});
    manager.emit('moduleAdd', {lineage:['test','a','d1','e2'], id:'test2'});

    expect(policy.isRunning(policy.runtimes[0], 'test', [], false)).toEqual('test1');
    expect(policy.isRunning(policy.runtimes[0], 'test', ['a','b','c'], true)).toEqual('test1');
    expect(policy.isRunning(policy.runtimes[0], 'test', ['a','b','e'], true)).toEqual(false);
    expect(policy.isRunning(policy.runtimes[0], 'test', ['a','d','e'], true)).toEqual('test2');
  });
  
  it('Loads Manifests', function(done) {
    policy.loadManifest('manifest://{"x":"y"}').then(function(manifest) {
      expect(manifest.x).toEqual('y');
      done();
    });
  });

  it('Keeps track of running modules', function() {
    var port2 = {};
    util.handleEvents(port2);
    policy.add(port2, {});
    port2.emit('moduleAdd', {lineage:['test'], id:'test'});
    expect(policy.isRunning(policy.runtimes[1], 'test', [], false)).toEqual('test');
    port2.emit('moduleRemove', {lineage:['test'], id:'test'});
    expect(policy.isRunning(policy.runtimes[1], 'test', [], false)).toEqual(false);
  });

  it('Overlays policy / config', function() {
    var customPolicy = {
      background: true,
      interactive: false,
      custom: true
    };
    expect(policy.overlay(policy.defaultPolicy, customPolicy)).toEqual(customPolicy);

    var nullPolicy = {};
    expect(policy.overlay(policy.defaultPolicy, nullPolicy)).toEqual(policy.defaultPolicy);
  });
});
},{"../../src/debug":25,"../../src/policy":31,"../../src/resource":38,"../../src/util":39}],18:[function(require,module,exports){
var Provider = require('../../src/provider');
var Promise = require('es6-promise').Promise;

describe("Provider", function() {
  var port, o, constructspy;
  beforeEach(function() {
    var definition = {
      'm1': {type: 'method', value:['string'], ret:'string'},
      'm2': {type: 'method', value:[{'name':'string'}]},
      'e1': {type: 'event', value:'string'},
      'c1': {type: 'constant', value:"test_constant"}
    };
    port = new Provider(definition);

    constructspy = jasmine.createSpy('constructor');
    o = function() {
      constructspy(arguments);
    };
    o.prototype.m1 = function(str) {
      return "m1-called";
    };
    o.prototype.m2 = function(obj) {
      return obj.name;
    };
  });

  it("presents a public interface which can be provided.", function() {
    var iface = port.getInterface();
    expect(iface['provideSynchronous']).toBeDefined();
    expect(iface.c1).toEqual("test_constant");

    iface.provideSynchronous(o);
    // setup.
    port.onMessage('default', {
      channel: 'message'
    });
    expect(constructspy).not.toHaveBeenCalled();

    port.onMessage('default', {to: 'testInst', type:'message', message:{'type': 'construct'}});
    
    expect(constructspy).toHaveBeenCalled();
  });

  it("constructs interfaces with arguments in a reasonable way.", function() {
    var definition = {
      'constructor': {value: ['object']}
    };
    port = new Provider(definition);
    var iface = port.getInterface();
    expect(iface['provideSynchronous']).toBeDefined();

    o = function(dispatchEvent, arg) {
      constructspy(arg);
    };
    iface.provideSynchronous(o);
    // setup.
    port.onMessage('default', {
      channel: 'message'
    });
    expect(constructspy).not.toHaveBeenCalled();

    port.onMessage('default', {to: 'testInst', type:'message', message:{
      'type': 'construct',
      'text': [{'test':'hi'}],
      'binary': []
    }});

    expect(constructspy).toHaveBeenCalledWith({'test':'hi'});
  });

  it("allows promises to be used.", function(done) {
    var iface = port.getInterface();
    var o = function() {};
    var called = false, resp;
    o.prototype.m1 = function(str) {
      called = true;
      return Promise.resolve('resolved ' + str);
    };

    iface.providePromises(o);
    port.onMessage('default', {
      channel: 'message'
    });

    port.onMessage('default', {to: 'testInst', type:'message', message:{
      'type': 'construct',
    }});

    port.onMessage('default', {to: 'testInst', type:'message', message: {
      'action': 'method',
      'type': 'm1',
      'text': ['mystr'],
      'reqId': 1
    }});

    expect(called).toEqual(true);

    port.on('message', function(n) {
      expect(n.message.text).toEqual('resolved mystr');
      done();
    });
  });

  it("Allows closing", function() {
    var iface = port.getProxyInterface();
    var maker = iface();
    maker.provideSynchronous(o);

    var spy = jasmine.createSpy('cb');
    iface.onClose(spy);

    port.close();
    expect(spy).toHaveBeenCalled();
  });
});

},{"../../src/provider":32,"es6-promise":1}],19:[function(require,module,exports){
var Proxy = require('../../src/proxy');
var EventInterface = require('../../src/proxy/eventInterface');

describe("Proxy", function() {
  var port;
  beforeEach(function() {
    port = new Proxy(EventInterface);
  });

  it("reports messages back to the port", function() {
    var iface = port.getInterface();
    expect(iface.on).toBeDefined();
    var spy = jasmine.createSpy('cb');
    port.on('message', spy);

    // setup.
    port.onMessage('default', {
      channel: 'message'
    });
    expect(spy).not.toHaveBeenCalled();

    // existing interfaces now work.
    iface.emit('hi', 'msg');
    expect(spy).toHaveBeenCalled();
    
    // New interfaces also will.
    iface = port.getInterface();
    iface.emit('hi', 'msg');
    expect(spy.calls.count()).toEqual(2);
  });

  it("reports messages to the interface", function() {
    // setup.
    port.onMessage('default', {
      channel: 'message'
    });
    var iface = port.getInterface();
    var spy = jasmine.createSpy('cb');
    iface.on('message', spy);
    
    port.onMessage('default', {type:'message', message:{type:'message', message: 'thing'}});
    expect(spy).toHaveBeenCalledWith('thing');
  });
  
  it("sends constructor arguments to appropriate interface", function() {
    var arg = undefined;
    var myInterface = function(onMsg, emit, debug, x) {
      arg = x;
    };
    // setup.
    port = new Proxy(myInterface);

    port.onMessage('default', {
      channel: 'message'
    });
    var iface = port.getInterface('arg1');
    expect(arg).toEqual('arg1');

    arg = undefined;
    var proxy = port.getProxyInterface();
    proxy('arg1');
    expect(arg).toEqual('arg1');
  });

  it("closes the interface when asked", function() {
    // setup.
    port.onMessage('control', {
      type: 'setup',
      channel: 'control'
    });
    port.onMessage('default', {
      channel: 'message'
    });
    var spy = jasmine.createSpy('cb');
    port.on('message', spy);
    var closeSpy = jasmine.createSpy('close');
    port.on('control', closeSpy);

    var publicProxy = port.getProxyInterface();
    var iface = publicProxy();
    iface.emit('hi', 'msg');

    expect(spy).toHaveBeenCalled();
    publicProxy.close();
    iface.emit('hi', 'msg');
    expect(spy.calls.count()).toEqual(1);
    expect(closeSpy).toHaveBeenCalled();
    expect(closeSpy.calls.argsFor(0)[0].request).toEqual('close');
  });

  it("reports errors when they occur", function() {
    // setup.
    port.onMessage('control', {
      type: 'setup',
      channel: 'control'
    });
    port.onMessage('default', {
      channel: 'message'
    });
    var spy = jasmine.createSpy('msg');
    var espy = jasmine.createSpy('cb');
    port.on('message', spy);

    var publicProxy = port.getProxyInterface();
    var iface = publicProxy();
    publicProxy.onError(espy);
    iface.emit('hi', 'msg');
    expect(spy).toHaveBeenCalled();

    expect(espy).not.toHaveBeenCalled();
    port.onMessage('default', {
      type: 'error',
      to: false,
      message: 'msg'
    });
    expect(espy).toHaveBeenCalled();
  });
});

},{"../../src/proxy":33,"../../src/proxy/eventInterface":36}],20:[function(require,module,exports){
var ApiInterface = require('../../src/proxy/apiInterface');

describe("proxy/APIInterface", function() {
  var emit, reg, api;
  beforeEach(function() {
        var iface = {
      'test': {'type': 'method', 'value': ['string'], 'ret': 'string'},
      'ev': {'type': 'event', 'value': 'string'},
      'co': {'type': 'constant', 'value': '12'}
    };
    emit = jasmine.createSpy('emit');
    var onMsg = function(obj, r) {
      reg = r;
    };
    api = new ApiInterface(iface, onMsg, emit);
  });

  it("Creates an object looking like an interface.", function(done) {
    expect(typeof(api.test)).toEqual('function');
    expect(typeof(api.on)).toEqual('function');
    expect(api.co).toEqual('12');

    expect(emit).toHaveBeenCalledWith({
      'type': 'construct',
      'text': [],
      'binary': []
    });
    var promise = api.test('hi');
    expect(emit).toHaveBeenCalledWith({
      action: 'method',
      type: 'test',
      reqId: 0,
      text: ['hi'],
      binary: []
    });

    var spy = jasmine.createSpy('ret');
    promise.then(function(response) {
      spy();
      expect(response).toEqual('boo!');;
      done();
    });
    expect(spy).not.toHaveBeenCalled();

    reg('message', {
      type: 'method',
      reqId: 0,
      text: 'boo!',
      binary: []
    });
  });

  it("Delivers constructor arguments.", function(done) {
    var iface = {
      'constructor': {value: ['string']}
    };
    var onMsg = function(obj, r) {
        reg = r;
      };
    var callback = function(msg) {
      expect(msg).toEqual({
        'type': 'construct',
        'text': ['my param'],
        'binary': []
      });
      done();
    };
    var debug = {};
    var apimaker = ApiInterface.bind({}, iface, onMsg, callback, debug);
    var api = new apimaker('my param');
  });

  it("Doesn't encapuslate constructor args as an array.", function(done) {
    var iface = {
      'constructor': {value: ['object']}
    };
    var onMsg = function(obj, r) {
        reg = r;
      };
    var callback = function(msg) {
      expect(msg).toEqual({
        'type': 'construct',
        'text': [{'test':'hi'}],
        'binary': []
      });
      done();
    };
    var debug = {};
    var apimaker = ApiInterface.bind({}, iface, onMsg, callback, debug);
    var api = new apimaker({'test':'hi'});
  });

  it("Rejects methods on failure.", function(done) {
    var promise = api.test('hi'),
        spy = jasmine.createSpy('fail');
    promise.catch(function (err) {
      expect(err).toEqual('Error Occured');
      done();
    });
    
    reg('message', {
      type: 'method',
      reqId: 0,
      text: 'errval',
      error: 'Error Occured'
    });
  });

  it("delivers events", function() {
    var cb = jasmine.createSpy('cb');
    api.on('ev', cb);
    expect(cb).not.toHaveBeenCalled();

    reg('message', {
      'type': 'event',
      'name': 'ev',
      'text': 'boo!',
      'binary': []
    });
    expect(cb).toHaveBeenCalledWith('boo!');
  });
});

afterEach(function() {
  var frames = document.getElementsByTagName('iframe');
  for (var i = 0; i < frames.length; i++) {
    frames[i].parentNode.removeChild(frames[i]);
  }
});

var Proxy = require('../../src/proxy');

describe("Proxy.recursiveFreezeObject", function() {
  it("Freezes objects", function () {
    var obj = {
      a: 1,
      b: {
        c: 2
      }
    };
    var frozen = Proxy.recursiveFreezeObject(obj);
    frozen.a = 5;
    frozen.b = 5;
    frozen.c = 5;
    expect(frozen.a).toEqual(1);
    expect(frozen.b.c).toEqual(2);
  });
});

describe("Proxy.conform", function() {
  var debug = {
    error: function() {}
  };

  it("Conforms Simple values to templates", function() {
    var blob = null;
    if (typeof(Blob) === typeof(Function)) {
      blob = new Blob(['hi']);
    } else {
      var build = new WebKitBlobBuilder();
      build.append('hi');
      blob = build.getBlob();
    }
    var template = {
      'p1': 'string',
      'p2': 'number',
      'p3': 'boolean',
      'p4': 'object',
      'p5': 'blob',
      'p6': 'buffer',
      'p8': 'proxy',
      'p9': ['array', 'string'],
      'p10': ['string', 'number'],
      'p11': {'a': 'string', 'b': 'number'}
    };
    var correct = {
      'p1': 'hi',
      'p2': 12,
      'p3': true,
      'p4': {'x': 12, 'y': 43},
      'p5': 0,
      'p6': 1,
      'p8': ['app', 'flow', 'id'],
      'p9': ['string', 'string2', 'string3'],
      'p10': ['test', 12],
      'p11': {'a': 'hi', 'b': 12}
    };
    var conformed = Proxy.conform(template, correct,
                                       [blob, new ArrayBuffer(2)], false);
    correct['p5'] = conformed['p5'];
    correct['p6'] = conformed['p6'];
    expect(conformed).toEqual(correct);

    var incorrect = {
      'p0': 'test',
      'p1': 12,
      'p2': '12',
      'p3': 'hello',
      'p4': [1,2,3],
      'p6': 'str',
      'p8': function() {},
      'p9': [1, {}],
      'p10': [true, false, true],
      'p11': []
    };

    conformed = Proxy.conform(template, incorrect, [0, blob, blob], false);
    expect(conformed).toEqual({
      'p1': '12',
      'p2': 12,
      'p3': false,
      'p4': [1,2,3],
      'p6': conformed.p6,
      'p8': undefined,
      'p9': ['1', '[object Object]'],
      'p10': ['true', 0],
      'p11': {}
    });
  });

  it("conforms simple arguments", function() {
    expect(Proxy.conform("string", "mystring", [], false, debug)).toEqual("mystring");
    expect(Proxy.conform("number", "mystring", [], false, debug)).toEqual(jasmine.any(Number));
    expect(Proxy.conform("boolean", "mystring", [], false, debug)).toEqual(false);
    expect(Proxy.conform("", "mystring", [], false, debug)).toEqual(undefined);
    expect(Proxy.conform(["string", "number"], ["test", 0], [], false, debug))
      .toEqual(["test", 0]);
    expect(Proxy.conform("number", 0, [], false, debug)).toEqual(0);
  });

  it("conforms complex arguments", function() {
    expect(Proxy.conform({"key":"string"}, {"key":"good", "other":"bad"},[], false)).
        toEqual({"key":"good"});
    expect(Proxy.conform(["string"], ["test", 12],[], false)).toEqual(["test"]);
    expect(Proxy.conform(["array", "string"], ["test", 12],[], false)).toEqual(["test", "12"]);
    expect(Proxy.conform("object", {"simple":"string"},[], false)).toEqual({"simple": "string"});
    //expect(fdom.proxy.conform.bind({}, "object", function() {},[], false)).toThrow();
    expect(Proxy.conform("object", function() {},[], false)).not.toBeDefined();
  });

  it("conforms nulls", function() {
    expect(Proxy.conform({"key": "string"}, {"key": null}, [], false)).
      toEqual({"key": null});
    expect(Proxy.conform("object", null, [], false)).toEqual(null);
    expect(Proxy.conform({"key": "string"}, {"key": undefined}, [], false)).
      toEqual({});
    expect(Proxy.conform(["string", "string", "string", "string"], 
                              [null, undefined, null, 0], [], false)).
      toEqual([null, undefined, null, "0"]);
    expect(Proxy.conform("object", undefined, [], false)).toEqual(undefined);
  });

  it("conforms binary arguments", function() {
    // TODO: test Blob support (API is nonstandard between Node and Browsers)
    /*
     * var blob = new Blob(["test"]);
     * expect(conform("blob", blob)).toEqual(blob);
     * expect(conform("blob", "string")).toEqual(jasmine.any(Blob));
     */

    var buffer = new ArrayBuffer(4);
    var externals = [];
    expect(Proxy.conform("buffer", buffer, externals, true, debug)).toEqual(0);
    expect(externals.length).toEqual(1);
    expect(Proxy.conform("buffer", 0, ["string"], false, debug)).toEqual(jasmine.any(ArrayBuffer));
    expect(Proxy.conform("buffer", 0, externals, false, debug)).toEqual(buffer);
  });
});

},{"../../src/proxy":33,"../../src/proxy/apiInterface":34}],21:[function(require,module,exports){
var Debug = require('../../src/debug');
var Resource = require('../../src/resource');

describe("Resource", function() {
  var resources, debug;

  beforeEach(function() {
    debug = new Debug();
    resources = new Resource(debug);
  });

  it("should resolve URLs", function(done) {
    var promise = resources.get("http://localhost/folder/manifest.json",
                                 "file.js");
    var callback = function(response) {
      expect(response).toEqual('http://localhost/folder/file.js');
      done();
    };
    promise.then(callback);
  });

  it("should cache resolved URLs", function(done) {
    spyOn(resources, 'resolve').and.callThrough();
    var promise = resources.get("http://localhost/folder/manifest.json",
                                 "file.js");
    var callback = function() {
      promise = resources.get("http://localhost/folder/manifest.json",
                              "file.js");
      promise.then(function() {
        expect(resources.resolve.calls.count()).toEqual(1);
        done();
      });
    };
    promise.then(callback);
  });

  it("should fetch URLs", function(done) {
    var promise;
    promise = resources.getContents('manifest://{"name":"test"}');
    promise.then(function(response) {
      expect(JSON.parse(response).name).toEqual("test");
      done();
    });
  });
  
  it("should warn on degenerate URLs", function(done) {
    var promise = resources.getContents();
    var spy = jasmine.createSpy('r');
    promise.then(function() {}, function() {
      resources.resolve('test').then(function(){}, function() {
        done();
      });
    });
  });

  it("should handle custom resolvers", function(done) {
    var resolver = function(manifest, url, resolve) {
      if (manifest.indexOf('test') === 0) {
        resolve('resolved://' + url);
        return true;
      } else {
        return false;
      }
    };
    resources.addResolver(resolver);

    resources.get('test://manifest', 'myurl').then(function(url) {
      expect(url).toEqual('resolved://myurl');
      resources.get('otherprot://manifest', 'myurl').then(function(url2) {
        expect(url2).toEqual(undefined);
      });
      setTimeout(done,0);
    });
  });

  it("should handle custom retrievers", function(done) {
    var retriever = function(url, resolve) {
      expect(url).toContain("test://");
      resolve('Custom content!');
    };
    resources.addRetriever('test', retriever);

    resources.getContents('test://url').then(function(data) {
      expect(data).toEqual('Custom content!');
      resources.getContents('unknown://url').then(function(){}, function(){
        done();
      });
    });
  });

  it("should not allow replacing retrievers", function() {
    var retriever = function(url, deferred) {
      expect(url).toContain("test://");
      deferred.resolve('Custom content!');
    };
    spyOn(debug, 'warn');
    resources.addRetriever('http', retriever);
    expect(debug.warn).toHaveBeenCalled();
  });
});

describe('resources.httpResolver', function() {
  var r, f, spy, resources;

  beforeEach(function() {
    resources = new Resource();
    r = spy = jasmine.createSpy('resolvedURL');
    f = function() {};
  });

  it("should resolve relative URLs", function() {
    resources.httpResolver('http://www.example.com/path/manifest.json', 'test.html', r, f);
    expect(spy).toHaveBeenCalledWith('http://www.example.com/path/test.html');
  });

  it("should resolve path absolute URLs", function() {
    resources.httpResolver('http://www.example.com/path/manifest.json', '/test.html', r, f);
    expect(spy).toHaveBeenCalledWith('http://www.example.com/test.html');
  });

  it("should resolve absolute URLs", function() {
    resources.httpResolver('http://www.example.com/path/manifest.json', 'http://www.other.com/test.html', r, f);
    expect(spy).toHaveBeenCalledWith('http://www.other.com/test.html');
  });

  it("should not resolve URLs without manifest", function() {
    resources.httpResolver(undefined, 'test.html', r, f);
    expect(spy).toHaveBeenCalledWith(false);
  });

  it("should remove relative paths", function() {
    var result = Resource.removeRelativePath('http:////www.example.com/./../test1/test2/../test3/')
    expect(result).toEqual('http://www.example.com/test1/test3/');
  });

  it("should resolve paths with relative paths", function() {
    resources.httpResolver('http://www.example.com/path/manifest.json', '../../test.html', r, f);
    expect(spy).toHaveBeenCalledWith('http://www.example.com/test.html');
  });

  it("should remove buggy cca URLs", function() {
    resources.httpResolver('chrome-extension:////extensionid/manifest.json', 'resource.js', r, f);
    expect(spy).toHaveBeenCalledWith('chrome-extension://extensionid/resource.js');
  });
});

},{"../../src/debug":25,"../../src/resource":38}],22:[function(require,module,exports){
var util = require('../../src/util');

describe("util", function() {
  it("iterates over an array", function() {
    var array = [1, 4, 9, 16];
    var sum = 0;
    var ids = [];
    util.eachReverse(array, function(el, idx) {
      sum += el;
      ids.push(idx);
    });

    expect(sum).toEqual(30);
    expect(ids).toEqual([3, 2, 1, 0]);

    util.eachReverse(false, function() {
      sum = 100;
    });
    expect(sum).toEqual(30);
  });

  it("stops iterating if needed", function() {
    var array = [1, 4, 9, 16];
    var sum = 0;
    util.eachReverse(array, function(el) {
      sum += el;
      return el % 2 != 0;
    });
    expect(sum).toEqual(25);
  });

  it("locates properties", function() {
    var obj = {};
    Object.defineProperty(obj, "testProp", {});

    expect(util.hasProp(obj, "testProp")).toBeTruthy();
  });

  it("iterates properties", function() {
    var obj = {
      a: 1,
      b: 2,
      c: 4
    };
    var sum = 0;
    var props = [];
    util.eachProp(obj, function(val, name) {
      sum += val;
      props.push(name);
    });

    expect(sum).toEqual(7);
    expect(props).toContain('a');
    expect(props).toContain('c');

    sum = 0;
    util.eachProp(obj, function(val, name) {
      sum += val;
      return name === 'b'
    });
    expect(sum).toEqual(3);
  });

  describe("mixin", function() {
    var base, other;

    beforeEach(function() {
      base = {value: 1};
      other = {value: 2, other:2};
    });

    it("mixes Objects together", function() {
      util.mixin(base, other);
      expect(base.value).toEqual(1);
      expect(base.other).toEqual(2);
    });

    it("forcably mixes Objects together", function() {
      util.mixin(base, other, true);
      expect(base.value).toEqual(2);
      expect(base.other).toEqual(2);
    });

    it("recursively mixes Objects together", function() {
      base.obj = {val: 1, mine: 3};
      other.obj = {val: 2};
      util.mixin(base, other, true);
      expect(base.obj.val).toEqual(2);
      expect(base.obj.mine).toBeUndefined();
    });

    it("handles degenerate mixins", function() {
      var result = util.mixin(base, null, true);
      expect(result).toEqual({value: 1});
    });
  });

  describe("getId", function() {
    it("creates unique IDs", function() {
      var id1 = util.getId();
      var id2 = util.getId();
      expect(id1).not.toEqual(id2);
    });
  });

  describe("handleEvents", function() {
    var object, cb;

    beforeEach(function() {
      object = {};
      cb = jasmine.createSpy('cb');
      util.handleEvents(object);
    });

    it("can execute events", function() {
      object.on('msg', cb);
      object.emit('msg', 'value');
      object.emit('msg', 'value2');
      expect(cb).toHaveBeenCalledWith('value2');
      expect(cb.calls.count()).toEqual(2);
    });

    it("can execute events 'Once'", function() {
      object.once('msg', cb);
      object.emit('msg', 'value');
      object.emit('msg', 'value2');
      expect(cb).toHaveBeenCalledWith('value');
      expect(cb.calls.count()).toEqual(1);
    });

    it("can execute events conditionally", function() {
      object.once(function(type, val) {
        return val == 'yes';
      }, cb);
      object.emit('msg', 'value');
      object.emit('msg', 'yes');
      object.emit('othermsg', 'yes');
      expect(cb).toHaveBeenCalledWith('yes');
      expect(cb.calls.count()).toEqual(1);
    });
    
    it("can requeue conditioanl events", function() {
      var f = function(m) {
        m == 'ok' ? cb() : object.once('msg', f);
      };
      object.once('msg', f);
      object.emit('msg', 'bad');
      expect(cb).not.toHaveBeenCalled();
      object.emit('msg', 'ok');
      expect(cb).toHaveBeenCalled();
    });

    it("can unregister events", function() {
      object.on('msg', cb);
      object.off('msg', cb);
      object.emit('msg', 'value');
      expect(cb).not.toHaveBeenCalled();
    });

    it("Can cleanup all events", function() {
      object.on('msg', cb);
      object.on('other', cb);
      object.off();
      object.emit('msg', 'value');
      expect(cb).not.toHaveBeenCalled();
    });

    it("can unregister conditional events", function() {
      var func = function(type, val) {
        return val == 'yes';
      };
      object.once(func, cb);
      object.off(func);
      object.emit('msg', 'yes');
      expect(cb).not.toHaveBeenCalled();
    })
  });
});

},{"../../src/util":39}],23:[function(require,module,exports){
var Resource = require('../src/resource');
var util = require('../src/util');

exports.createTestPort = function(id) {
  var port = {
    id: id,
    messages: [],
    gotMessageCalls: [],
    checkGotMessage: function() {
      var len = this.gotMessageCalls.length;
      for (var i=0; i<len; i++) {
        var call = this.gotMessageCalls.shift();
        var result = this.gotMessage(call.from, call.match);
        if (result !== false) {
          call.callback(result);
        } else {
          this.gotMessageCalls.push(call);
        }
      }
    },
    onMessage: function(from, msg) {
      this.messages.push([from, msg]);
      this.emit('onMessage', msg);
      this.checkGotMessage();
    },
    gotMessage: function(from, match) {
      var okay;
      for (var i = 0; i < this.messages.length; i++) {
        if (this.messages[i][0] === from) {
          okay = true;
          for (var j in match) {
            if (this.messages[i][1][j] !== match[j]) {
              okay = false;
            }
          }
          if (okay) {
            return this.messages[i][1];
          }
        }
      }
      return false;
    },
    gotMessageAsync: function(from, match, callback) {
      this.gotMessageCalls.push({
        from: from,
        match: match,
        callback: callback
      });
      this.checkGotMessage();
    }
    
  };

  util.handleEvents(port);

  return port;
};

exports.mockIface = function(props, consts) {
  var iface = {};
  props.forEach(function(p) {
    if (p[1] && p[1].then) {
      iface[p[0]] = function(r) {
        return r;
      }.bind({}, p[1]);
    } else {
      iface[p[0]] = function(r) {
        return Promise.resolve(r);
      }.bind({}, p[1]);
    }
    spyOn(iface, p[0]).and.callThrough();
  });
  if (consts) {
    consts.forEach(function(c) {
      iface[c[0]] = c[1];
    });
  }
  return function() {
    return iface;
  };
};

var fdom_src;
exports.getFreedomSource = function(id) {
  if(typeof fdom_src === 'undefined'){
    try {
      var xhr = new XMLHttpRequest();
      xhr.open("get", "freedom.js", false);
      xhr.overrideMimeType("text/javascript; charset=utf-8");
      xhr.send(null);
      fdom_src = xhr.responseText;
    } catch (err) { // Synchronous XHR wont work in Chrome App (Chrome Test Runner), so load from global var.
      if (typeof jasmine.getGlobal().freedom_src !== 'undefined') {
        fdom_src = jasmine.getGlobal().freedom_src;
      } else {
        throw "Could not load freedom source from XHR or global var. To work in a Chrome App, getFreedomSource() must be called from a jasmine test case or beforeEach()";
      }
    }
  }
  return fdom_src;
}

// Setup resource loading for the test environment, which uses file:// urls.
exports.setupResolvers = function() { 
  var rsrc = new Resource();
  rsrc.addResolver(function(manifest, url, resolve) {
    if (url.indexOf('relative://') === 0) {
      var loc = location.protocol + "//" + location.host + location.pathname;
      var dirname = loc.substr(0, loc.lastIndexOf('/'));
      resolve(dirname + '/' + url.substr(11));
      return true;
    }
    resolve(false);
    return false;
  });
  rsrc.addResolver(function(manifest, url, resolve) {
    if (manifest.indexOf('file://') === 0) {
      manifest = 'http' + manifest.substr(4);
      rsrc.resolve(manifest, url).then(function(addr) {
        addr = 'file' + addr.substr(4);
        resolve(addr);
      });
      return true;
    }
    resolve(false);
    return false;
  });
  rsrc.addRetriever('file', rsrc.xhrRetriever);
  return rsrc;
}

exports.cleanupIframes = function() {
  var frames = document.getElementsByTagName('iframe');
  // frames is a live HTMLCollection, so it is modified each time an
  // element is removed.
  while (frames.length > 0) {
    frames[0].parentNode.removeChild(frames[0]);
  }
}

exports.setupModule = function(manifest_url) {
  var freedom_src = getFreedomSource();
  var global = {console: {log: function(){}}, document: document};
  setupResolvers();

  var path = window.location.href;
  var dir_idx = path.lastIndexOf('/');
  var dir = path.substr(0, dir_idx) + '/';
  return fdom.setup(global, undefined, {
    manifest: manifest_url,
    portType: "Frame",
    inject: dir + "node_modules/es5-shim/es5-shim.js",
    src: freedom_src
  });
}

exports.providerFor = function(module, api) {
  var manifest = {
    name: 'providers',
    app: {script: 'relative://spec/helper/providers.js'},
    dependencies: {undertest: {url: 'relative://' + module, api: api}}
  };
  var freedom = setupModule('manifest://' + JSON.stringify(manifest));
  var provider = new ProviderHelper(freedom);
  provider.create = function(name) {
    this.freedom.emit("create", {name: name, provider: 'undertest'});
  };
  return provider;
}

function ProviderHelper(inFreedom) {
  this.callId = 0;
  this.callbacks = {};
  this.errcallbacks = {};
  this.unboundChanCallbacks = [];
  this.chanCallbacks = {};
  this.freedom = inFreedom;
  this._eventListeners = {};
  this.freedom.on("eventFired", this._on.bind(this));
  this.freedom.on("return", this.ret.bind(this));
  this.freedom.on("error", this.err.bind(this));
  this.freedom.on("initChannel", this.onInitChannel.bind(this));
  this.freedom.on("inFromChannel", this.onInFromChannel.bind(this));
}

ProviderHelper.prototype.createProvider = function(name, provider,
                                                   constructorArguments) {
  this.freedom.emit('create', {
    name: name,
    provider: provider,
    constructorArguments: constructorArguments
  });
};

ProviderHelper.prototype.create = ProviderHelper.prototype.createProvider;

ProviderHelper.prototype.call = function(provider, method, args, cb, errcb) {
  this.callId += 1;
  this.callbacks[this.callId] = cb;
  this.errcallbacks[this.callId] = errcb;
  this.freedom.emit('call', {
    id: this.callId,
    provider: provider,
    method: method,
    args: args
  });
  return this.callId;
};

ProviderHelper.prototype.ret = function(obj) {
  if (this.callbacks[obj.id]) {
    this.callbacks[obj.id](obj.data);
    delete this.callbacks[obj.id];
  }
};

ProviderHelper.prototype.err = function(obj) {
  if (this.errcallbacks[obj.id]) {
    this.errcallbacks[obj.id](obj.data);
    delete this.errcallbacks[obj.id];
  }
}

ProviderHelper.prototype._on = function(eventInfo) {
  var provider = eventInfo.provider;
  var event = eventInfo.event;
  var eventPayload = eventInfo.eventPayload;
  var listeners = this._eventListeners[provider][event];
  if (listeners) {
    listeners.forEach(function (listener) {
      listener(eventPayload);
    });
  }
};

ProviderHelper.prototype.on = function(provider, event, listener) {
  if (typeof this._eventListeners[provider] === 'undefined') {
    this._eventListeners[provider] = {};
  }
  if (typeof this._eventListeners[provider][event] === 'undefined') {
    this._eventListeners[provider][event] = [];
  }
  this._eventListeners[provider][event].push(listener);
  this.freedom.emit("listenForEvent", {provider: provider,
                                 event: event});
};

/**
 * Remove all listeners registered through "on" for an event. If an event is not
 * specified, then all listeners for the provider are removed.
 */
ProviderHelper.prototype.removeListeners = function(provider, event) {
  if (typeof this._eventListeners[provider] !== 'undefined') {
    if (event) {
      this._eventListeners[provider][event] = [];
    } else {
      this._eventListeners[provider] = {};
    }
  }
};



ProviderHelper.prototype.createChannel = function(cb) {
  this.unboundChanCallbacks.push(cb);
  this.freedom.emit('createChannel');
};

ProviderHelper.prototype.onInitChannel = function(chanId) {
  var cb = this.unboundChanCallbacks.pop(); 
  cb(chanId);
};

ProviderHelper.prototype.setChannelCallback = function(chanId, cb) {
  this.chanCallbacks[chanId] = cb;
};
ProviderHelper.prototype.sendToChannel = function(chanId, msg) {
  this.freedom.emit("outToChannel", {
    chanId: chanId,
    message: msg
  });
};
ProviderHelper.prototype.onInFromChannel = function(data) {
  this.chanCallbacks[data.chanId](data.message);
};

exports.ProviderHelper = ProviderHelper;
},{"../src/resource":38,"../src/util":39}],24:[function(require,module,exports){
/*jslint indent:2,white:true,node:true,sloppy:true */
var Promise = require('es6-promise').Promise;

/**
 * The API registry for freedom.js.  Used to look up requested APIs,
 * and provides a bridge for core APIs to act like normal APIs.
 * @Class API
 * @param {Debug} debug The debugger to use for logging.
 * @constructor
 */
var Api = function(debug) {
  this.debug = debug;
  this.apis = {};
  this.providers = {};
  this.waiters = {};
};

/**
 * Get an API.
 * @method get
 * @param {String} api The API name to get.
 * @returns {{name:String, definition:API}} The API if registered.
 */
Api.prototype.get = function(api) {
  if (!this.apis[api]) {
    return false;
  }
  return {
    name: api,
    definition: this.apis[api]
  };
};

/**
 * Set an API to a definition.
 * @method set
 * @param {String} name The API name.
 * @param {API} definition The JSON object defining the API.
 */
Api.prototype.set = function(name, definition) {
  this.apis[name] = definition;
};

/**
 * Register a core API provider.
 * @method register
 * @param {String} name the API name.
 * @param {Function} constructor the function to create a provider for the API.
 * @param {String?} style The style the provider is written in. Valid styles
 *   are documented in fdom.port.Provider.prototype.getInterface. Defaults to
 *   provideAsynchronous
 */
Api.prototype.register = function(name, constructor, style) {
  var i;

  this.providers[name] = {
    constructor: constructor,
    style: style || 'provideAsynchronous'
  };

  if (this.waiters[name]) {
    for (i = 0; i < this.waiters[name].length; i += 1) {
      this.waiters[name][i].resolve(constructor.bind({},
          this.waiters[name][i].from));
    }
    delete this.waiters[name];
  }
};

/**
 * Get a core API connected to a given FreeDOM module.
 * @method getCore
 * @param {String} name the API to retrieve.
 * @param {port.App} from The instantiating App.
 * @returns {Promise} A promise of a fdom.App look-alike matching
 * a local API definition.
 */
Api.prototype.getCore = function(name, from) {
  return new Promise(function(resolve, reject) {
    if (this.apis[name]) {
      if (this.providers[name]) {
        resolve(this.providers[name].constructor.bind({}, from));
      } else {
        if (!this.waiters[name]) {
          this.waiters[name] = [];
        }
        this.waiters[name].push({
          resolve: resolve,
          reject: reject,
          from: from
        });
      }
    } else {
      this.debug.warn('Api.getCore asked for unknown core: ' + name);
      reject(null);
    }
  }.bind(this));
};

/**
 * Get the style in which a core API is written.
 * This method is guaranteed to know the style of a provider returned from
 * a previous getCore call, and so does not use promises.
 * @method getInterfaceStyle
 * @param {String} name The name of the provider.
 * @returns {String} The coding style, as used by
 *   fdom.port.Provider.prototype.getInterface.
 */
Api.prototype.getInterfaceStyle = function(name) {
  if (this.providers[name]) {
    return this.providers[name].style;
  } else {
    this.debug.warn('Api.getInterfaceStyle for unknown provider: ' + name);
    return undefined;
  }
};

/**
 * Defines the apis module and provider registry.
 */
module.exports = Api;

},{"es6-promise":1}],25:[function(require,module,exports){
/*jslint indent:2, node:true, sloppy:true */
var util = require('./util');

/**
 * A freedom entry point for debugging.
 * @uses handleEvents
 * @implements Port
 * @constructor
 */
var Debug = function (logger) {
  this.id = 'debug';
  this.emitChannel = false;
  this.console = null;
  this.config = false;
  util.handleEvents(this);
};

/**
 * Provide a textual description of this port.
 * @method toString
 * @return {String} the textual description.
 */
Debug.prototype.toString = function () {
  return '[Console]';
};

/**
 * Register a logger for outputting debugging messages.
 * @method setLogger
 * @param {Console} logger The logger to register
 */
Debug.prototype.setLogger = function (logger) {
  if (this.logger) {
    this.info('Replacing Logger.');
  }
  this.logger = logger;
  this.emit('logger');
};

/**
 * Handler for receiving messages sent to the debug port.
 * These messages are used to retreive config for exposing console.
 * @method onMessage
 * @param {String} source the source identifier for the message.
 * @param {Object} message the received message.
 */
Debug.prototype.onMessage = function (source, message) {
  if (source === 'control' && message.channel && !this.emitChannel) {
    this.emitChannel = message.channel;
    this.config = message.config;
    this.console = message.config.global.console;
    this.emit('ready');
  }
};

/**
 * Dispatch a debug message with arbitrary severity.
 * All debug messages are routed through the manager, to allow for delegation.
 * @method format
 * @param {String} severity the severity of the message.
 * @param {String} source The location of message.
 * @param {String[]} args The contents of the message.
 * @private
 */
Debug.prototype.format = function (severity, source, args) {
  var i, alist = [], argarr;
  if (typeof args === "string" && source) {
    try {
      argarr = JSON.parse(args);
      if (argarr instanceof Array) {
        args = argarr;
      }
    } catch (e) {
      // pass.
    }
  }

  if (typeof args === "string") {
    alist.push(args);
  } else {
    for (i = 0; i < args.length; i += 1) {
      alist.push(args[i]);
    }
  }
  if (!this.emitChannel) {
    this.on('ready', this.format.bind(this, severity, source, alist));
    return;
  }
  this.emit(this.emitChannel, {
    severity: severity,
    source: source,
    quiet: true,
    request: 'debug',
    msg: JSON.stringify(alist)
  });
};

/**
 * Print received messages on the console.
 * This is called by the manager in response to an emission from format.
 * @method print
 * @param {Object} message The message emitted by {@see format} to print.
 */
Debug.prototype.print = function (message) {
  if (!this.logger) {
    this.once('logger', this.print.bind(this, message));
    return;
  }

  var args, arr = [], i = 0;
  if (this.console !== this) {
    args = JSON.parse(message.msg);
    if (typeof args === "string") {
      arr.push(args);
    } else {
      while (args[i] !== undefined) {
        arr.push(args[i]);
        i += 1;
      }
    }
    this.logger[message.severity].call(this.logger, message.source, arr, function () {});
  }
};

/**
 * Print a log message to the console.
 * @method log
 */
Debug.prototype.log = function () {
  this.format('log', undefined, arguments);
};

/**
 * Print an info message to the console.
 * @method log
 */
Debug.prototype.info = function () {
  this.format('info', undefined, arguments);
};

/**
 * Print a debug message to the console.
 * @method log
 */
Debug.prototype.debug = function () {
  this.format('debug', undefined, arguments);
};

/**
 * Print a warning message to the console.
 * @method warn
 */
Debug.prototype.warn = function () {
  this.format('warn', undefined, arguments);
};

/**
 * Print an error message to the console.
 * @method error
 */
Debug.prototype.error = function () {
  this.format('error', undefined, arguments);
};

/**
 * Get a logger that logs messages prefixed by a given name.
 * @method getLogger
 * @param {String} name The prefix for logged messages.
 * @returns {Console} A console-like object.
 */
Debug.prototype.getLogger = function (name) {
  var log = function (severity, source) {
    var args = Array.prototype.splice.call(arguments, 2);
    this.format(severity, source, args);
  },
    logger = {
      debug: log.bind(this, 'debug', name),
      info: log.bind(this, 'info', name),
      log: log.bind(this, 'log', name),
      warn: log.bind(this, 'warn', name),
      error: log.bind(this, 'error', name)
    };
  return logger;
};

module.exports = Debug;

},{"./util":39}],26:[function(require,module,exports){
/*jslint indent:2,sloppy:true,node:true */
var util = require('./util');

/**
 * Defines fdom.Hub, the core message hub between freedom modules.
 * Incomming messages from apps are sent to hub.onMessage()
 * @class Hub
 * @param {Debug} debug Logger for debugging.
 * @constructor
 */
var Hub = function (debug) {
  this.debug = debug;
  this.config = {};
  this.apps = {};
  this.routes = {};
  this.unbound = [];

  util.handleEvents(this);
  this.on('config', function (config) {
    util.mixin(this.config, config);
  }.bind(this));
};

/**
 * Handle an incoming message from a freedom app.
 * @method onMessage
 * @param {String} source The identifiying source of the message.
 * @param {Object} message The sent message.
 */
Hub.prototype.onMessage = function (source, message) {
  var destination = this.routes[source], type;
  if (!destination || !destination.app) {
    this.debug.warn("Message dropped from unregistered source " + source);
    return;
  }

  if (!this.apps[destination.app]) {
    this.debug.warn("Message dropped to destination " + destination.app);
    return;
  }

  if (!message.quiet && !destination.quiet) {
    type = message.type;
    if (message.type === 'message' && message.message &&
        message.message.action === 'method') {
      type = 'method.' + message.message.type;
    } else if (message.type === 'method' && message.message &&
        message.message.type === 'method') {
      type = 'return.' + message.message.name;
    } else if (message.type === 'message' && message.message &&
        message.message.type === 'event') {
      type = 'event.' + message.message.name;
    }
    this.debug.debug(this.apps[destination.source].toString() +
        " -" + type + "-> " +
        this.apps[destination.app].toString() + "." + destination.flow);
  }

  this.apps[destination.app].onMessage(destination.flow, message);
};

/**
 * Get the local destination port of a flow.
 * @method getDestination
 * @param {String} source The flow to retrieve.
 * @return {Port} The destination port.
 */
Hub.prototype.getDestination = function (source) {
  var destination = this.routes[source];
  if (!destination) {
    return null;
  }
  return this.apps[destination.app];
};

/**
 * Get the local source port of a flow.
 * @method getSource
 * @param {Port} source The flow identifier to retrieve.
 * @return {Port} The source port.
 */
Hub.prototype.getSource = function (source) {
  if (!source) {
    return false;
  }
  if (!this.apps[source.id]) {
    this.debug.warn("No registered source '" + source.id + "'");
    return false;
  }
  return this.apps[source.id];
};

/**
 * Register a destination for messages with this hub.
 * @method register
 * @param {Port} app The Port to register.
 * @param {Boolean} [force] Whether to override an existing port.
 * @return {Boolean} Whether the app was registered.
 */
Hub.prototype.register = function (app, force) {
  if (!this.apps[app.id] || force) {
    this.apps[app.id] = app;
    return true;
  } else {
    return false;
  }
};

/**
 * Deregister a destination for messages with the hub.
 * Note: does not remove associated routes. As such, deregistering will
 * prevent the installation of new routes, but will not distrupt existing
 * hub routes.
 * @method deregister
 * @param {Port} app The Port to deregister
 * @return {Boolean} Whether the app was deregistered.
 */
Hub.prototype.deregister = function (app) {
  if (!this.apps[app.id]) {
    return false;
  }
  delete this.apps[app.id];
  return true;
};

/**
 * Install a new route in the hub.
 * @method install
 * @param {Port} source The source of the route.
 * @param {Port} destination The destination of the route.
 * @param {String} flow The flow where the destination will receive messages.
 * @param {Boolean} quiet Whether messages on this route should be suppressed.
 * @return {String} A routing source identifier for sending messages.
 */
Hub.prototype.install = function (source, destination, flow, quiet) {
  source = this.getSource(source);
  if (!source) {
    return;
  }
  if (!destination) {
    this.debug.warn("Unwilling to generate blackhole flow from " + source.id);
    return;
  }

  var route = this.generateRoute();
  this.routes[route] = {
    app: destination,
    flow: flow,
    source: source.id,
    quiet: quiet
  };
  if (typeof source.on === 'function') {
    source.on(route, this.onMessage.bind(this, route));
  }

  return route;
};

/**
 * Uninstall a hub route.
 * @method uninstall
 * @param {Port} source The source of the route.
 * @param {String} flow The route to uninstall.
 * @return {Boolean} Whether the route was able to be uninstalled.
 */
Hub.prototype.uninstall = function (source, flow) {
  source = this.getSource(source);
  if (!source) {
    return;
  }

  var route = this.routes[flow];
  if (!route) {
    return false;
  } else if (route.source !== source.id) {
    this.debug.warn("Flow " + flow + " does not belong to port " + source.id);
    return false;
  }

  delete this.routes[flow];
  if (typeof source.off === 'function') {
    source.off(route);
  }
  return true;
};

/**
 * Generate a unique routing identifier.
 * @method generateRoute
 * @return {String} a routing source identifier.
 * @private
 */
Hub.prototype.generateRoute = function () {
  return util.getId();
};

module.exports = Hub;

},{"./util":39}],27:[function(require,module,exports){
/*jslint indent:2,node:true,sloppy:true */
var util = require('./util');
var ModuleInternal = require('./moduleinternal');

/**
 * A freedom port which manages the control plane of of changing hub routes.
 * @class Manager
 * @implements Port
 * @param {Hub} hub The routing hub to control.
 * @param {Resource} resource The resource manager for the runtime.
 * @param {Api} api The API manager for the runtime.
 * @constructor
 */
var Manager = function (hub, resource, api) {
  this.id = 'control';
  this.config = {};
  this.controlFlows = {};
  this.dataFlows = {};
  this.dataFlows[this.id] = [];
  this.reverseFlowMap = {};

  this.debug = hub.debug;
  this.hub = hub;
  this.resource = resource;
  this.api = api;

  this.delegate = null;
  this.toDelegate = {};
  
  this.hub.on('config', function (config) {
    util.mixin(this.config, config);
    this.emit('config');
  }.bind(this));
  
  util.handleEvents(this);
  this.hub.register(this);
};

/**
 * Provide a textual description of this port.
 * @method toString
 * @return {String} the description of this port.
 */
Manager.prototype.toString = function () {
  return "[Local Controller]";
};

/**
 * Process messages sent to this port.
 * The manager, or 'control' destination handles several types of messages,
 * identified by the request property.  The actions are:
 * 1. debug. Prints the message to the console.
 * 2. link. Creates a link between the source and a provided destination port.
 * 3. environment. Instantiate a module environment defined in ModuleInternal.
 * 4. delegate. Routes a defined set of control messages to another location.
 * 5. resource. Registers the source as a resource resolver.
 * 6. core. Generates a core provider for the requester.
 * 7. close. Tears down routes involing the requesting port.
 * 8. unlink. Tears down a route from the requesting port.
 * @method onMessage
 * @param {String} flow The source identifier of the message.
 * @param {Object} message The received message.
 */
Manager.prototype.onMessage = function (flow, message) {
  var reverseFlow = this.controlFlows[flow], origin;
  if (!reverseFlow) {
    this.debug.warn("Unknown message source: " + flow);
    return;
  }
  origin = this.hub.getDestination(reverseFlow);

  if (this.delegate && reverseFlow !== this.delegate &&
      this.toDelegate[flow]) {
    // Ship off to the delegee
    this.emit(this.delegate, {
      type: 'Delegation',
      request: 'handle',
      quiet: true,
      flow: flow,
      message: message
    });
    return;
  }

  if (message.request === 'debug') {
    this.debug.print(message);
    return;
  }

  if (message.request === 'link') {
    this.createLink(origin, message.name, message.to, message.overrideDest);
  } else if (message.request === 'environment') {
    this.createLink(origin, message.name, new ModuleInternal(this));
  } else if (message.request === 'delegate') {
    // Initate Delegation.
    if (this.delegate === null) {
      this.delegate = reverseFlow;
    }
    this.toDelegate[message.flow] = true;
    this.emit('delegate');
  } else if (message.request === 'resource') {
    this.resource.addResolver(message.args[0]);
    this.resource.addRetriever(message.service, message.args[1]);
  } else if (message.request === 'core') {
    if (this.core && reverseFlow === this.delegate) {
      (new this.core()).onMessage(origin, message.message);
      return;
    }
    this.getCore(function (to, core) {
      this.hub.onMessage(to, {
        type: 'core',
        core: core
      });
    }.bind(this, reverseFlow));
  } else if (message.request === 'close') {
    this.destroy(origin);
  } else if (message.request === 'unlink') {
    this.removeLink(origin, message.to);
  } else {
    this.debug.warn("Unknown control request: " + message.request);
    this.debug.log(JSON.stringify(message));
    return;
  }
};

/**
 * Get the port messages will be routed to given its id.
 * @method getPort
 * @param {String} portId The ID of the port.
 * @returns {fdom.Port} The port with that ID.
 */
Manager.prototype.getPort = function (portId) {
  return this.hub.getDestination(this.controlFlows[portId]);
};

/**
 * Set up a port with the hub.
 * @method setup
 * @param {Port} port The port to register.
 */
Manager.prototype.setup = function (port) {
  if (!port.id) {
    this.debug.warn("Refusing to setup unidentified port ");
    return false;
  }

  if (this.controlFlows[port.id]) {
    this.debug.warn("Refusing to re-initialize port " + port.id);
    return false;
  }

  if (!this.config.global) {
    this.once('config', this.setup.bind(this, port));
    return;
  }

  this.hub.register(port);
  var flow = this.hub.install(this, port.id, "control"),
    reverse = this.hub.install(port, this.id, port.id);
  this.controlFlows[port.id] = flow;
  this.dataFlows[port.id] = [reverse];
  this.reverseFlowMap[flow] = reverse;
  this.reverseFlowMap[reverse] = flow;

  if (port.lineage) {
    this.emit('moduleAdd', {id: port.id, lineage: port.lineage});
  }
  
  this.hub.onMessage(flow, {
    type: 'setup',
    channel: reverse,
    config: this.config
  });

  return true;
};

/**
 * Tear down a port on the hub.
 * @method destroy
 * @apram {Port} port The port to unregister.
 */
Manager.prototype.destroy = function (port) {
  if (!port.id) {
    this.debug.warn("Unable to tear down unidentified port");
    return false;
  }

  if (port.lineage) {
    this.emit('moduleRemove', {id: port.id, lineage: port.lineage});
  }

  // Remove the port.
  delete this.controlFlows[port.id];

  // Remove associated links.
  var i;
  for (i = this.dataFlows[port.id].length - 1; i >= 0; i -= 1) {
    this.removeLink(port, this.dataFlows[port.id][i]);
  }

  // Remove the port.
  delete this.dataFlows[port.id];
  this.hub.deregister(port);
};

/**
 * Create a link between two ports.  Links are created in both directions,
 * and a message with those capabilities is sent to the source port.
 * @method createLink
 * @param {Port} port The source port.
 * @param {String} name The flow for messages from destination to port.
 * @param {Port} destination The destination port.
 * @param {String} [destName] The flow name for messages to the destination.
 * @param {Boolean} [toDest] Tell the destination about the link.
 */
Manager.prototype.createLink = function (port, name, destination, destName,
                                         toDest) {
  if (!this.config.global) {
    this.once('config',
      this.createLink.bind(this, port, name, destination, destName));
    return;
  }
  
  if (!this.controlFlows[port.id]) {
    this.debug.warn('Unwilling to link from non-registered source.');
    return;
  }

  if (!this.controlFlows[destination.id]) {
    if (this.setup(destination) === false) {
      this.debug.warn('Could not find or setup destination.');
      return;
    }
  }
  var quiet = destination.quiet || false,
    outgoingName = destName || 'default',
    outgoing = this.hub.install(port, destination.id, outgoingName, quiet),
    reverse;

  // Recover the port so that listeners are installed.
  destination = this.hub.getDestination(outgoing);
  reverse = this.hub.install(destination, port.id, name, quiet);

  this.reverseFlowMap[outgoing] = reverse;
  this.dataFlows[port.id].push(outgoing);
  this.reverseFlowMap[reverse] = outgoing;
  this.dataFlows[destination.id].push(reverse);

  if (toDest) {
    this.hub.onMessage(this.controlFlows[destination.id], {
      type: 'createLink',
      name: outgoingName,
      channel: reverse,
      reverse: outgoing
    });
  } else {
    this.hub.onMessage(this.controlFlows[port.id], {
      name: name,
      type: 'createLink',
      channel: outgoing,
      reverse: reverse
    });
  }
};

/**
 * Remove a link between to ports. The reverse link will also be removed.
 * @method removeLink
 * @param {Port} port The source port.
 * @param {String} name The flow to be removed.
 */
Manager.prototype.removeLink = function (port, name) {
  var reverse = this.hub.getDestination(name),
    rflow = this.reverseFlowMap[name],
    i;

  if (!reverse || !rflow) {
    this.debug.warn("Could not find metadata to remove flow: " + name);
    return;
  }

  if (this.hub.getDestination(rflow).id !== port.id) {
    this.debug.warn("Source port does not own flow " + name);
    return;
  }

  // Notify ports that a channel is closing.
  i = this.controlFlows[port.id];
  if (i) {
    this.hub.onMessage(i, {
      type: 'close',
      channel: name
    });
  }
  i = this.controlFlows[reverse.id];
  if (i) {
    this.hub.onMessage(i, {
      type: 'close',
      channel: rflow
    });
  }

  // Uninstall the channel.
  this.hub.uninstall(port, name);
  this.hub.uninstall(reverse, rflow);

  delete this.reverseFlowMap[name];
  delete this.reverseFlowMap[rflow];
  this.forgetFlow(reverse.id, rflow);
  this.forgetFlow(port.id, name);
};

/**
 * Forget the flow from id with a given name.
 * @method forgetFlow
 * @private
 * @param {String} id The port ID of the source.
 * @param {String} name The flow name.
 */
Manager.prototype.forgetFlow = function (id, name) {
  var i;
  if (this.dataFlows[id]) {
    for (i = 0; i < this.dataFlows[id].length; i += 1) {
      if (this.dataFlows[id][i] === name) {
        this.dataFlows[id].splice(i, 1);
        break;
      }
    }
  }
};

/**
 * Get the core freedom.js API active on the current hub.
 * @method getCore
 * @private
 * @param {Function} cb Callback to fire with the core object.
 */
Manager.prototype.getCore = function (cb) {
  if (this.core) {
    cb(this.core);
  } else {
    this.api.getCore('core', this).then(function (core) {
      this.core = core;
      cb(this.core);
    }.bind(this));
  }
};

module.exports = Manager;

},{"./moduleinternal":30,"./util":39}],28:[function(require,module,exports){
/*jslint indent:2,white:true,node:true,sloppy:true */
var util = require('./util');
var Provider = require('./provider');

/**
 * The external Port face of a module on a hub.
 * @class Module
 * @extends Port
 * @param {String} manifestURL The manifest this module loads.
 * @param {String[]} creator The lineage of creation for this module.
 * @param {Policy} Policy The policy loader for dependencies.
 * @constructor
 */
var Module = function(manifestURL, manifest, creator, policy) {
  this.api = policy.api;
  this.policy = policy;
  this.resource = policy.resource;
  this.debug = policy.debug;

  this.config = {};

  this.id = manifestURL + Math.random();
  this.manifestId = manifestURL;
  this.manifest = manifest;
  this.lineage = [this.manifestId].concat(creator);

  this.quiet = this.manifest.quiet || false;

  this.externalPortMap = {};
  this.internalPortMap = {};
  this.started = false;

  util.handleEvents(this);
};

/**
 * Receive a message for the Module.
 * @method onMessage
 * @param {String} flow The origin of the message.
 * @param {Object} message The message received.
 */
Module.prototype.onMessage = function(flow, message) {
  if (flow === 'control') {
    if (message.type === 'setup') {
      this.controlChannel = message.channel;
      util.mixin(this.config, message.config);
      this.emit(this.controlChannel, {
        type: 'Core Provider',
        request: 'core'
      });
      this.start();
      return;
    } else if (message.type === 'createLink' && message.channel) {
      this.externalPortMap[message.name] = message.channel;
      if (this.internalPortMap[message.name] === undefined) {
        this.internalPortMap[message.name] = false;
      }
      this.emit(message.channel, {
        type: 'default channel announcement',
        channel: message.reverse
      });
      return;
    } else if (message.core) {
      this.core = new message.core();
      this.emit('core', message.core);
      return;
    } else if (message.type === 'close') {
      // Closing channel.
      if (message.channel === 'control') {
        this.stop();
      }
      this.deregisterFlow(message.channel, false);
    } else {
      this.port.onMessage(flow, message);
    }
  } else {
    if ((this.externalPortMap[flow] === false ||
        !this.externalPortMap[flow])&& message.channel) {
      //console.log('handling channel announcement for ' + flow);
      this.externalPortMap[flow] = message.channel;
      if (this.internalPortMap[flow] === undefined) {
        this.internalPortMap[flow] = false;

        // New incoming connection attempts should get routed to modInternal.
        if (this.manifest.provides && this.modInternal) {
          console.warn('conn req sent');
          this.port.onMessage(this.modInternal, {
            type: 'Connection',
            channel: flow
          });
        } else if (this.manifest.provides) {
          this.once('modInternal', function(flow) {
            this.port.onMessage(this.modInternal,{
              type: 'Connection',
              channel: flow
            });
          }.bind(this, flow));
        // First connection retains legacy mapping as 'default'.
        } else if (!this.externalPortMap['default'] && message.channel) {
          this.externalPortMap['default'] = message.channel;
          this.once('internalChannelReady', function(flow) {
            this.internalPortMap[flow] = this.internalPortMap['default'];
          }.bind(this, flow));
        }
      }
      return;
    } else if (!this.started) {
      this.once('start', this.onMessage.bind(this, flow, message));
    } else {
      if (this.internalPortMap[flow] === false) {
        console.warn('waiting on internal channel for msg');
        this.once('internalChannelReady', this.onMessage.bind(this, flow, message));
      } else if (!this.internalPortMap[flow]) {
        this.debug.error('Unexpected message from ' + flow);
        return;
      } else {
        this.port.onMessage(this.internalPortMap[flow], message);
      }
    }
  }
};

/**
 * Clean up after a flow which is no longer used / needed.
 * @method deregisterFLow
 * @param {String} flow The flow to remove mappings for.
 * @param {Boolean} internal If the flow name is the internal identifier.
 * @returns {Boolean} Whether the flow was successfully deregistered.
 * @private
 */
Module.prototype.deregisterFlow = function(flow, internal) {
  var key,
      map = internal ? this.internalPortMap : this.externalPortMap;
  // TODO: this is inefficient, but seems less confusing than a 3rd
  // reverse lookup map.
  for (key in map) {
    if (map[key] === flow) {
      if (internal) {
        this.emit(this.controlChannel, {
          type: 'Channel Teardown',
          request: 'unlink',
          to: this.externalPortMap[key]
        });
      } else {
        this.port.onMessage('control', {
          type: 'close',
          channel: this.internalPortMap[key]
        });
      }
      delete this.externalPortMap[key];
      delete this.internalPortMap[key];
      return true;
    }
  }
  return false;
};

/**
 * Attempt to start the module once the remote freedom context
 * exists.
 * @method start
 * @private
 */
Module.prototype.start = function() {
  var Port;
  if (this.started || this.port) {
    return false;
  }
  if (this.controlChannel) {
    this.loadLinks();
    Port = this.config.portType;
    this.port = new Port(this.manifest.name);
    // Listen to all port messages.
    this.port.on(this.emitMessage.bind(this));
    this.port.addErrorHandler(function(err) {
      this.debug.warn('Module Failed', err);
      this.stop();
    }.bind(this));
    // Tell the local port to ask us for help.
    this.port.onMessage('control', {
      channel: 'control',
      config: this.config
    });

    // Tell the remote location to delegate debugging.
    this.port.onMessage('control', {
      type: 'Redirect',
      request: 'delegate',
      flow: 'debug'
    });
    this.port.onMessage('control', {
      type: 'Redirect',
      request: 'delegate',
      flow: 'core'
    });
    
    // Tell the container to instantiate the counterpart to this external view.
    this.port.onMessage('control', {
      type: 'Environment Configuration',
      request: 'environment',
      name: 'ModInternal'
    });
  }
};

/**
 * Stop the module when it is no longer needed, and tear-down state.
 * @method stop
 * @private
 */
Module.prototype.stop = function() {
  if (!this.started) {
    return;
  }
  if (this.port) {
    this.port.off();
    this.port.onMessage('control', {
      type: 'close',
      channel: 'control'
    });
    delete this.port;
  }
  this.started = false;
};

/**
 * Textual Description of the Port
 * @method toString
 * @return {String} The description of this Port.
 */
Module.prototype.toString = function() {
  return "[Module " + this.manifest.name +"]";
};

/**
 * Intercept messages as they arrive from the module,
 * mapping them between internal and external flow names.
 * @method emitMessage
 * @param {String} name The destination the module wants to send to.
 * @param {Object} message The message to send.
 * @private
 */
Module.prototype.emitMessage = function(name, message) {
  if (this.internalPortMap[name] === false && message.channel) {
    this.internalPortMap[name] = message.channel;
    this.emit('internalChannelReady');
    return;
  }
  // Terminate debug redirection requested in start().
  if (name === 'control') {
    if (message.flow === 'debug' && message.message) {
      this.debug.format(message.message.severity,
          message.message.source || this.toString(),
          message.message.msg);
    } else if (message.flow === 'core' && message.message) {
      if (!this.core) {
        this.once('core', this.emitMessage.bind(this, name, message));
        return;
      }
      if (message.message.type === 'register') {
        message.message.reply = this.port.onMessage.bind(this.port, 'control');
        this.externalPortMap[message.message.id] = false;
      }
      this.core.onMessage(this, message.message);
    } else if (message.name === 'ModInternal' && !this.modInternal) {
      this.modInternal = message.channel;
      this.port.onMessage(this.modInternal, {
        type: 'Initialization',
        id: this.manifestId,
        appId: this.id,
        manifest: this.manifest,
        lineage: this.lineage,
        channel: message.reverse
      });
      this.emit('modInternal');
    } else if (message.type === 'createLink') {
      this.internalPortMap[message.name] = message.channel;
      this.port.onMessage(message.channel, {
        type: 'channel announcement',
        channel: message.reverse
      });
      this.emit('internalChannelReady');
    } else if (message.type === 'close') {
      this.deregisterFlow(message.channel, true);
    }
  } else if (name === 'ModInternal' && message.type === 'ready' && !this.started) {
    this.started = true;
    this.emit('start');
  } else if (name === 'ModInternal' && message.type === 'resolve') {
    this.resource.get(this.manifestId, message.data).then(function(id, data) {
      this.port.onMessage(this.modInternal, {
        type: 'resolve response',
        id: id,
        data: data
      });
    }.bind(this, message.id), function() {
      this.debug.warn('Error Resolving URL for Module.');
    }.bind(this));
  } else {
    this.emit(this.externalPortMap[name], message);
  }
  return false;
};

/**
 * Request the external routes used by this module.
 * @method loadLinks
 * @private
 */
Module.prototype.loadLinks = function() {
  var i, channels = ['default'], name, dep,
      finishLink = function(dep, name, provider) {
        var style = this.api.getInterfaceStyle(name);
        dep.getInterface()[style](provider);
      };
  if (this.manifest.permissions) {
    for (i = 0; i < this.manifest.permissions.length; i += 1) {
      name = this.manifest.permissions[i];
      if (channels.indexOf(name) < 0 && name.indexOf('core.') === 0) {
        channels.push(name);
        dep = new Provider(this.api.get(name).definition, this.debug);
        this.api.getCore(name, this).then(finishLink.bind(this, dep, name));

        this.emit(this.controlChannel, {
          type: 'Core Link to ' + name,
          request: 'link',
          name: name,
          to: dep
        });
      }
    }
  }
  if (this.manifest.dependencies) {
    util.eachProp(this.manifest.dependencies, function(desc, name) {
      if (channels.indexOf(name) < 0) {
        channels.push(name);
      }
      this.resource.get(this.manifestId, desc.url).then(function (url) {
        this.policy.get(this.lineage, url).then(function(dep) {
          this.emit(this.controlChannel, {
            type: 'Link to ' + name,
            request: 'link',
            name: name,
            overrideDest: name + '.' + this.id,
            to: dep
          });
        }.bind(this));
        this.resource.getContents(url).then(this.updateEnv.bind(this, name));
      }.bind(this));
    }.bind(this));
  }
  // Note that messages can be synchronous, so some ports may already be bound.
  for (i = 0; i < channels.length; i += 1) {
    this.externalPortMap[channels[i]] = this.externalPortMap[channels[i]] || false;
    this.internalPortMap[channels[i]] = false;
  }
};

/**
 * Update the module environment with information about a dependent manifest.
 * @method updateEnv
 * @param {String} dep The dependency
 * @param {Object} manifest The manifest of the dependency
 */
Module.prototype.updateEnv = function(dep, manifest) {
  if (!manifest) {
    return;
  }
  if (!this.modInternal) {
    this.once('modInternal', this.updateEnv.bind(this, dep, manifest));
    return;
  }
  
  var data, metadata;

  try {
    data = JSON.parse(manifest);
  } catch(e) {
    this.debug.error("Could not parse environmental manifest: " + e);
    return;
  }

  // Decide if/what other properties should be exported.
  // Keep in sync with ModuleInternal.updateEnv
  metadata = {
    name: data.name,
    icon: data.icon,
    description: data.description,
    api: data.api
  };
  
  this.port.onMessage(this.modInternal, {
    type: 'manifest',
    name: dep,
    manifest: metadata
  });
};

module.exports = Module;

},{"./provider":32,"./util":39}],29:[function(require,module,exports){
/*jslint indent:2, node:true,sloppy:true */
var Promise = require('es6-promise').Promise;

var ApiInterface = require('./proxy/apiinterface');
var Provider = require('./provider');
var Proxy = require('./proxy');
var ProxyBinder = require('./proxybinder');
var util = require('./util');

/**
 * The internal logic for module setup, which makes sure the public
 * facing exports have appropriate properties, and load user scripts.
 * @class ModuleInternal
 * @extends Port
 * @param {Port} manager The manager in this module to use for routing setup.
 * @constructor
 */
var ModuleInternal = function (manager) {
  this.config = {};
  this.manager = manager;
  this.debug = manager.debug;
  this.binder = new ProxyBinder(this.manager);
  this.api = this.manager.api;
  this.manifests = {};
  
  this.id = 'ModuleInternal';
  this.pendingPorts = 0;
  this.requests = {};

  util.handleEvents(this);
};

/**
 * Message handler for this port.
 * This port only handles two messages:
 * The first is its setup from the manager, which it uses for configuration.
 * The second is from the module controller (fdom.port.Module), which provides
 * the manifest info for the module.
 * @method onMessage
 * @param {String} flow The detination of the message.
 * @param {Object} message The message.
 */
ModuleInternal.prototype.onMessage = function (flow, message) {
  if (flow === 'control') {
    if (!this.controlChannel && message.channel) {
      this.controlChannel = message.channel;
      util.mixin(this.config, message.config);
    }
  } else if (flow === 'default' && !this.appId) {
    // Recover the ID of this module:
    this.port = this.manager.hub.getDestination(message.channel);
    this.externalChannel = message.channel;
    this.appId = message.appId;
    this.lineage = message.lineage;

    var objects = this.mapProxies(message.manifest);

    this.generateEnv(message.manifest, objects).then(function () {
      return this.loadLinks(objects);
    }.bind(this)).then(this.loadScripts.bind(this, message.id,
        message.manifest.app.script));
  } else if (flow === 'default' && this.requests[message.id]) {
    this.requests[message.id](message.data);
    delete this.requests[message.id];
  } else if (flow === 'default' && message.type === 'manifest') {
    this.emit('manifest', message);
    this.updateManifest(message.name, message.manifest);
  } else if (flow === 'default' && message.type === 'Connection') {
    // Multiple connections can be made to the default provider.
    if (this.defaultPort) {
      this.manager.createLink(this.defaultPort, message.channel,
                              this.port, message.channel);
    } else {
      this.once('start', this.onMessage.bind(this, flow, message));
    }
  }
};

/**
 * Get a textual description of this Port.
 * @method toString
 * @return {String} a description of this Port.
 */
ModuleInternal.prototype.toString = function () {
  return "[Environment Helper]";
};

/**
 * Generate an externaly visisble namespace
 * @method generateEnv
 * @param {Object} manifest The manifest of the module.
 * @param {Object[]} items Other interfaces to load.
 * @returns {Promise} A promise when the external namespace is visible.
 * @private
 */
ModuleInternal.prototype.generateEnv = function (manifest, items) {
  return this.binder.bindDefault(this.port, this.api, manifest, true).then(
    function (binding) {
      var i = 0;
      this.defaultPort = binding.port;
      if (binding.external.api) {
        for (i = 0; i < items.length; i += 1) {
          if (items[i].name === binding.external.api && items[i].def.provides) {
            items.splice(i, 1);
            break;
          }
        }
      }
      this.config.global.freedom = binding.external;
    }.bind(this)
  );
};

/**
 * Attach a proxy to the externally visible namespace.
 * @method attach
 * @param {String} name The name of the proxy.
 * @param {ProxyInterface} proxy The proxy to attach.
 * @param {String} api The API the proxy implements.
 * @private.
 */
ModuleInternal.prototype.attach = function (name, proxy) {
  var exp = this.config.global.freedom;

  if (!exp[name]) {
    exp[name] = proxy.external;
    if (this.manifests[name]) {
      exp[name].manifest = this.manifests[name];
    }
  }

  this.pendingPorts -= 1;
  if (this.pendingPorts === 0) {
    this.emit('start');
  }
};

/**
 * Request a set of proxy interfaces, and bind them to the external
 * namespace.
 * @method loadLinks
 * @param {Object[]} items Descriptors of the proxy ports to load.
 * @private
 * @returns {Promise} Promise for when all links are loaded.
 */
//TODO(willscott): promise should be chained, rather than going through events.
ModuleInternal.prototype.loadLinks = function (items) {
  var i, proxy, provider, core,
    manifestPredicate = function (name, flow, msg) {
      return flow === 'manifest' && msg.name === name;
    },
    onManifest = function (item, msg) {
      var definition = {
        name: item.api
      };
      if (!msg.manifest.api || !msg.manifest.api[item.api]) {
        definition.definition = null;
      } else {
        definition.definition = msg.manifest.api[item.api];
      }
      this.binder.getExternal(this.port, item.name, definition).then(
        this.attach.bind(this, item.name)
      );
    }.bind(this),
    promise = new Promise(function (resolve, reject) {
      this.once('start', resolve);
    }.bind(this));

  for (i = 0; i < items.length; i += 1) {
    if (items[i].provides && !items[i].def) {
      this.debug.error('Module ' + this.appId + ' not loaded');
      this.debug.error('Unknown provider: ' + items[i].name);
    } else if (items[i].api && !items[i].def) {
      if (this.manifests[items[i].name]) {
        onManifest(items[i], {
          manifest: this.manifests[items[i].name]
        });
      } else {
        this.once(manifestPredicate.bind({}, items[i].name),
                  onManifest.bind(this, items[i]));
      }
    } else {
      this.binder.getExternal(this.port, items[i].name, items[i].def).then(
        this.attach.bind(this, items[i].name)
      );
    }
    this.pendingPorts += 1;
  }
  
  // Allow resolution of files by parent.
  this.manager.resource.addResolver(function (manifest, url, resolve) {
    var id = util.getId();
    this.requests[id] = resolve;
    this.emit(this.externalChannel, {
      type: 'resolve',
      id: id,
      data: url
    });
    return true;
  }.bind(this));

  // Attach Core.
  this.pendingPorts += 1;

  core = this.api.get('core').definition;
  provider = new Provider(core, this.debug);
  this.manager.getCore(function (CoreProv) {
    new CoreProv(this.manager).setId(this.lineage);
    provider.getInterface().provideAsynchronous(CoreProv);
  }.bind(this));

  this.emit(this.controlChannel, {
    type: 'Link to core',
    request: 'link',
    name: 'core',
    to: provider
  });
  
  this.binder.getExternal(provider, 'default', {
    name: 'core',
    definition: core
  }).then(
    this.attach.bind(this, 'core')
  );


//  proxy = new Proxy(ApiInterface.bind({}, core), this.debug);
//  this.manager.createLink(provider, 'default', proxy);
//  this.attach('core', {port: pr, external: proxy});

  if (this.pendingPorts === 0) {
    this.emit('start');
  }

  return promise;
};

/**
 * Update the exported manifest of a dependency.
 * Sets it internally if not yet exported, or attaches the property if it
 * is loaded after the module has started (we don't delay start to retreive
 * the manifest of the dependency.)
 * @method updateManifest
 * @param {String} name The Dependency
 * @param {Object} manifest The manifest of the dependency
 */
ModuleInternal.prototype.updateManifest = function (name, manifest) {
  var exp = this.config.global.freedom;

  if (exp && exp[name]) {
    exp[name].manifest = manifest;
  } else {
    this.manifests[name] = manifest;
  }
};

/**
 * Determine which proxy ports should be exposed by this module.
 * @method mapProxies
 * @param {Object} manifest the module JSON manifest.
 * @return {Object[]} proxy descriptors defined in the manifest.
 */
ModuleInternal.prototype.mapProxies = function (manifest) {
  var proxies = [], seen = ['core'], i, obj;
  
  if (manifest.permissions) {
    for (i = 0; i < manifest.permissions.length; i += 1) {
      obj = {
        name: manifest.permissions[i],
        def: undefined
      };
      obj.def = this.api.get(obj.name);
      if (seen.indexOf(obj.name) < 0 && obj.def) {
        proxies.push(obj);
        seen.push(obj.name);
      }
    }
  }
  
  if (manifest.dependencies) {
    util.eachProp(manifest.dependencies, function (desc, name) {
      obj = {
        name: name,
        api: desc.api
      };
      if (seen.indexOf(name) < 0) {
        if (desc.api) {
          obj.def = this.api.get(desc.api);
        }
        proxies.push(obj);
        seen.push(name);
      }
    }.bind(this));
  }
  
  if (manifest.provides) {
    for (i = 0; i < manifest.provides.length; i += 1) {
      obj = {
        name: manifest.provides[i],
        def: undefined
      };
      obj.def = this.api.get(obj.name);
      if (obj.def) {
        obj.def.provides = true;
      } else if (manifest.api && manifest.api[obj.name]) {
        obj.def = {
          name: obj.name,
          definition: manifest.api[obj.name],
          provides: true
        };
      }
      if (seen.indexOf(obj.name) < 0) {
        proxies.push(obj);
        seen.push(obj.name);
      }
    }
  }

  return proxies;
};

/**
 * Load external scripts into this namespace.
 * @method loadScripts
 * @param {String} from The URL of this modules's manifest.
 * @param {String[]} scripts The URLs of the scripts to load.
 */
ModuleInternal.prototype.loadScripts = function (from, scripts) {
  // TODO(salomegeo): add a test for failure.
  var importer = function (script, resolve, reject) {
    try {
      this.config.global.importScripts(script);
      resolve(true);
    } catch (e) {
      reject(e);
    }
  }.bind(this),
    scripts_count,
    load;
  if (typeof scripts === 'string') {
    scripts_count = 1;
  } else {
    scripts_count = scripts.length;
  }

  load = function (next) {
    if (next === scripts_count) {
      this.emit(this.externalChannel, {
        type: "ready"
      });
      return;
    }

    var script;
    if (typeof scripts === 'string') {
      script = scripts;
    } else {
      script = scripts[next];
    }

    this.manager.resource.get(from, script).then(function (url) {
      this.tryLoad(importer, url).then(function () {
        load(next + 1);
      }.bind(this));
    }.bind(this));
  }.bind(this);



  if (!this.config.global.importScripts) {
    importer = function (url, resolve, reject) {
      var script = this.config.global.document.createElement('script');
      script.src = url;
      script.addEventListener('load', resolve, true);
      this.config.global.document.body.appendChild(script);
    }.bind(this);
  }

  load(0);
};

/**
 * Attempt to load resolved scripts into the namespace.
 * @method tryLoad
 * @private
 * @param {Function} importer The actual import function
 * @param {String[]} urls The resoved URLs to load.
 * @returns {Promise} completion of load
 */
ModuleInternal.prototype.tryLoad = function (importer, url) {
  return new Promise(importer.bind({}, url)).then(function (val) {
    return val;
  }, function (e) {
    this.debug.warn(e.stack);
    this.debug.error("Error loading " + url, e);
    this.debug.error("If the stack trace is not useful, see https://" +
        "github.com/freedomjs/freedom/wiki/Debugging-Script-Parse-Errors");
  }.bind(this));
};

module.exports = ModuleInternal;

},{"./provider":32,"./proxy":33,"./proxy/apiinterface":35,"./proxybinder":37,"./util":39,"es6-promise":1}],30:[function(require,module,exports){
module.exports=require(29)
},{"./provider":32,"./proxy":33,"./proxy/apiinterface":35,"./proxybinder":37,"./util":39,"es6-promise":1}],31:[function(require,module,exports){
/*globals XMLHttpRequest */
/*jslint indent:2,white:true,node:true,sloppy:true */
var Promise = require('es6-promise').Promise;

var Module = require('./module');
var util = require('./util');

/**
 * The Policy registry for freedom.js.  Used to look up modules and provide
 * migration and coallesing of execution.
 * @Class Policy
 * @param {Manager} manager The manager of the active runtime.
 * @param {Resource} resource The resource loader of the active runtime.
 * @param {Object} config The local config.
 * @constructor
 */
var Policy = function(manager, resource, config) {
  this.api = manager.api;
  this.debug = manager.debug;
  this.location = config.location;
  this.resource = resource;

  this.config = config;
  this.runtimes = [];
  this.policies = [];

  this.add(manager, config.policy);
  this.runtimes[0].local = true;
};

/**
 * The policy a runtime is expected to have unless it specifies
 * otherwise.
 * TODO: consider making static
 * @property defaultPolicy
 */
Policy.prototype.defaultPolicy = {
  background: false, // Can this runtime run 'background' modules?
  interactive: true // Is there a view associated with this runtime?
  // TODO: remaining runtime policy.
};

/**
 * The constraints a code modules is expected to have unless it specifies
 * otherwise.
 * TODO: consider making static
 * @property defaultConstraints
 */
Policy.prototype.defaultConstraints = {
  isolation: "always", // values: always, app, never
  placement: "local" // values: local, stable, redundant
  // TODO: remaining constraints, express platform-specific dependencies.
};

/**
 * Resolve a module from its canonical URL.
 * Reponds with the promise of a port representing the module, 
 * @method get
 * @param {String[]} lineage The lineage of the requesting module.
 * @param {String} id The canonical ID of the module to get.
 * @returns {Promise} A promise for the local port towards the module.
 */
Policy.prototype.get = function(lineage, id) {
  return this.loadManifest(id).then(function(manifest) {
    var constraints = this.overlay(this.defaultConstraints, manifest.constraints),
        runtime = this.findDestination(lineage, id, constraints),
        portId;
    if (runtime.local) {
      portId = this.isRunning(runtime, id, lineage,
                             constraints.isolation !== 'never');
      if(constraints.isolation !== 'always' && portId) {
        this.debug.info('Reused port ' + portId);
        return runtime.manager.getPort(portId);
      } else {
        return new Module(id, manifest, lineage, this);
      }
    } else {
      // TODO: Create a port to go to the remote runtime.
      this.debug.error('Unexpected location selected for module placement');
      return false;
    }
  }.bind(this), function(err) {
    this.debug.error('Policy Error Resolving ' + id, err);
    return false;
  }.bind(this));
};

/**
 * Find the runtime destination for a module given its constraints and the
 * module creating it.
 * @method findDestination
 * @param {String[]} lineage The identity of the module creating this module.
 * @param {String] id The canonical url of the module
 * @param {Object} constraints Constraints for the module.
 * @returns {Object} The element of this.runtimes where the module should run.
 */
Policy.prototype.findDestination = function(lineage, id, constraints) {
  var i;

  // Step 1: if an instance already exists, the m
  if (constraints.isolation !== 'always') {
    for (i = 0; i < this.policies.length; i += 1) {
      if (this.isRunning(this.runtimes[i], id, lineage,
                         constraints.isolation !== 'never')) {
        return this.runtimes[i];
      }
    }
  }

  // Step 2: if the module wants stability, it may need to be remote.
  if (constraints.placement === 'local') {
    return this.runtimes[0];
  } else if (constraints.placement === 'stable') {
    for (i = 0; i < this.policies.length; i += 1) {
      if (this.policies[i].background) {
        return this.runtimes[i];
      }
    }
  }

  // Step 3: if the module needs longevity / interactivity, it may want to be remote.
  return this.runtimes[0];
};

/**
 * Determine if a known runtime is running an appropriate instance of a module.
 * @method isRunning
 * @param {Object} runtime The runtime to check.
 * @param {String} id The module to look for.
 * @param {String[]} from The identifier of the requesting module.
 * @param {Boolean} fullMatch If the module needs to be in the same app.
 * @returns {String|Boolean} The Module id if it is running, or false if not.
 */
Policy.prototype.isRunning = function(runtime, id, from, fullMatch) {
  var i = 0, j = 0, okay;
  for (i = 0; i < runtime.modules.length; i += 1) {
    if (fullMatch && runtime.modules[i].length === from.length + 1) {
      okay = true;
      for (j = 0; j < from.length; j += 1) {
        if (runtime.modules[i][j + 1].indexOf(from[j]) !== 0) {
          okay = false;
          break;
        }
      }
      if (runtime.modules[i][0].indexOf(id) !== 0) {
        okay = false;
      }

      if (okay) {
        return runtime.modules[i][0];
      }
    } else if (!fullMatch && runtime.modules[i][0].indexOf(id) === 0) {
      return runtime.modules[i][0];
    }
  }
  return false;
};

/**
 * Get a promise of the manifest for a module ID.
 * @method loadManifest
 * @param {String} manifest The canonical ID of the manifest
 * @returns {Promise} Promise for the json contents of the manifest.
 */
Policy.prototype.loadManifest = function(manifest) {
  return this.resource.getContents(manifest).then(function(data) {
    var resp = {};
    try {
      return JSON.parse(data);
    } catch(err) {
      this.debug.warn("Failed to load " + manifest + ": " + err);
      return {};
    }
  });
};

/**
 * Add a runtime to keep track of in this policy.
 * @method add
 * @param {fdom.port} port The port to use for module lifetime info
 * @param {Object} policy The policy of the runtime.
 */
Policy.prototype.add = function(port, policy) {
  var runtime = {
    manager: port,
    modules: []
  };
  this.runtimes.push(runtime);
  this.policies.push(this.overlay(this.defaultPolicy, policy));

  port.on('moduleAdd', function(runtime, info) {
    var lineage = info.lineage;
    lineage[0] = info.id;
    runtime.modules.push(lineage);
  }.bind(this, runtime));
  port.on('moduleRemove', function(runtime, info) {
    var lineage = info.lineage, i, modFingerprint;
    lineage[0] = info.id;
    modFingerprint = lineage.toString();

    for (i = 0; i < runtime.modules.length; i += 1) {
      if (runtime.modules[i].toString() === modFingerprint) {
        runtime.modules.splice(i, 1);
        return;
      }
    }
    this.debug.warn('Unknown module to remove: ', info.id);
  }.bind(this, runtime));
};

/**
 * Overlay a specific policy or constraint instance on default settings.
 * TODO: consider making static.
 * @method overlay
 * @private
 * @param {Object} base The default object
 * @param {Object} overlay The superceeding object
 * @returns {Object} A new object with base parameters when not set in overlay.
 */
Policy.prototype.overlay = function(base, overlay) {
  var ret = {};

  util.mixin(ret, base);
  if (overlay) {
    util.mixin(ret, overlay, true);
  }
  return ret;
};

module.exports = Policy;

},{"./module":28,"./util":39,"es6-promise":1}],32:[function(require,module,exports){
/*jslint indent:2, node:true, sloppy:true, browser:true */
var Proxy = require('./proxy');
var util = require('./util');

/**
 * A freedom port for a user-accessable provider.
 * @class Provider
 * @implements Port
 * @uses handleEvents
 * @param {Object} def The interface of the provider.
 * @param {Debug} debug The debugger to use for logging.
 * @contructor
 */
var Provider = function (def, debug) {
  this.id = Proxy.nextId();
  util.handleEvents(this);
  this.debug = debug;
  
  this.definition = def;
  this.mode = Provider.mode.synchronous;
  this.channels = {};
  this.iface = null;
  this.providerCls = null;
  this.providerInstances = {};
};

/**
 * Provider modes of operation.
 * @property mode
 * @static
 * @type number
 */
Provider.mode = {
  synchronous: 0,
  asynchronous: 1,
  promises: 2
};

/**
 * Receive external messages for the provider.
 * @method onMessage
 * @param {String} source the source identifier of the message.
 * @param {Object} message The received message.
 */
Provider.prototype.onMessage = function (source, message) {
  if (source === 'control' && message.reverse) {
    this.channels[message.name] = message.channel;
    this.emit(message.channel, {
      type: 'channel announcement',
      channel: message.reverse
    });
    this.emit('start');
  } else if (source === 'control' && message.type === 'setup') {
    this.controlChannel = message.channel;
  } else if (source === 'control' && message.type === 'close') {
    if (message.channel === this.controlChannel) {
      delete this.controlChannel;
    }
    this.close();
  } else {
    if (!this.channels[source] && message.channel) {
      this.channels[source] = message.channel;
      this.emit('start');
      return;
    } else if (!this.channels[source]) {
      this.debug.warn('Message from unconfigured source: ' + source);
      return;
    }

    if (message.type === 'close' && message.to) {
      delete this.providerInstances[source][message.to];
    } else if (message.to && this.providerInstances[source] &&
               this.providerInstances[source][message.to]) {
      message.message.to = message.to;
      this.providerInstances[source][message.to](message.message);
    } else if (message.to && message.message &&
        message.message.type === 'construct') {
      var args = Proxy.portableToMessage(
          (this.definition.constructor && this.definition.constructor.value) ?
              this.definition.constructor.value : [],
          message.message,
          this.debug
        );
      if (!this.providerInstances[source]) {
        this.providerInstances[source] = {};
      }
      this.providerInstances[source][message.to] = this.getProvider(source, message.to, args);
    } else {
      this.debug.warn(this.toString() + ' dropping message ' +
          JSON.stringify(message));
    }
  }
};

/**
 * Close / teardown the flow this provider terminates.
 * @method close
 */
Provider.prototype.close = function () {
  if (this.controlChannel) {
    this.emit(this.controlChannel, {
      type: 'Provider Closing',
      request: 'close'
    });
    delete this.controlChannel;
  }
  this.emit('close');

  this.providerInstances = {};
  this.emitChannel = null;
};

/**
 * Get an interface to expose externally representing this port.
 * Providers are registered with the port using either
 * provideSynchronous or provideAsynchronous depending on the desired
 * return interface.
 * @method getInterface
 * @return {Object} The external interface of this Provider.
 */
Provider.prototype.getInterface = function () {
  if (this.iface) {
    return this.iface;
  } else {
    this.iface = {
      provideSynchronous: function (prov) {
        this.providerCls = prov;
        this.mode = Provider.mode.synchronous;
      }.bind(this),
      provideAsynchronous: function (prov) {
        this.providerCls = prov;
        this.mode = Provider.mode.asynchronous;
      }.bind(this),
      providePromises: function (prov) {
        this.providerCls = prov;
        this.mode = Provider.mode.promises;
      }.bind(this),
      close: function () {
        this.close();
      }.bind(this)
    };

    util.eachProp(this.definition, function (prop, name) {
      switch (prop.type) {
      case "constant":
        Object.defineProperty(this.iface, name, {
          value: Proxy.recursiveFreezeObject(prop.value),
          writable: false
        });
        break;
      }
    }.bind(this));

    return this.iface;
  }
};

/**
 * Create a function that can be used to get interfaces from this provider from
 * a user-visible point.
 * @method getProxyInterface
 */
Provider.prototype.getProxyInterface = function () {
  var func = function (p) {
    return p.getInterface();
  }.bind({}, this);

  func.close = function (iface) {
    if (iface) {
      util.eachProp(this.ifaces, function (candidate, id) {
        if (candidate === iface) {
          this.teardown(id);
          this.emit(this.emitChannel, {
            type: 'close',
            to: id
          });
          return true;
        }
      }.bind(this));
    } else {
      // Close the channel.
      this.close();
    }
  }.bind(this);

  func.onClose = function (iface, handler) {
    if (typeof iface === 'function' && handler === undefined) {
      // Add an on-channel-closed handler.
      this.once('close', iface);
      return;
    }

    util.eachProp(this.ifaces, function (candidate, id) {
      if (candidate === iface) {
        if (this.handlers[id]) {
          this.handlers[id].push(handler);
        } else {
          this.handlers[id] = [handler];
        }
        return true;
      }
    }.bind(this));
  }.bind(this);

  return func;
};

/**
 * Get a new instance of the registered provider.
 * @method getProvider
 * @param {String} source The port this instance is interactign with.
 * @param {String} identifier the messagable address for this provider.
 * @param {Array} args Constructor arguments for the provider.
 * @return {Function} A function to send messages to the provider.
 */
Provider.prototype.getProvider = function (source, identifier, args) {
  if (!this.providerCls) {
    this.debug.warn('Cannot instantiate provider, since it is not provided');
    return null;
  }

  var events = {},
    dispatchEvent,
    BoundClass,
    instance;

  util.eachProp(this.definition, function (prop, name) {
    if (prop.type === 'event') {
      events[name] = prop;
    }
  });

  dispatchEvent = function (src, ev, id, name, value) {
    if (ev[name]) {
      var streams = Proxy.messageToPortable(ev[name].value, value,
                                                   this.debug);
      this.emit(this.channels[src], {
        type: 'message',
        to: id,
        message: {
          name: name,
          type: 'event',
          text: streams.text,
          binary: streams.binary
        }
      });
    }
  }.bind(this, source, events, identifier);

  // this is all to say: new providerCls(dispatchEvent, args[0], args[1],...)
  BoundClass = this.providerCls.bind.apply(this.providerCls,
      [this.providerCls, dispatchEvent].concat(args || []));
  instance = new BoundClass();

  return function (port, src, msg) {
    if (msg.action === 'method') {
      if (typeof this[msg.type] !== 'function') {
        this.debug.warn("Provider does not implement " + msg.type + "()!");
        return;
      }
      var prop = port.definition[msg.type],
        debug = this.debug,
        args = Proxy.portableToMessage(prop.value, msg, debug),
        ret = function (src, msg, prop, resolve, reject) {
          var streams = Proxy.messageToPortable(prop.ret, resolve,
                                                       debug);
          this.emit(this.channels[src], {
            type: 'method',
            to: msg.to,
            message: {
              to: msg.to,
              type: 'method',
              reqId: msg.reqId,
              name: msg.type,
              text: streams.text,
              binary: streams.binary,
              error: reject
            }
          });
        }.bind(port, src, msg, prop);
      if (!Array.isArray(args)) {
        args = [args];
      }
      if (port.mode === Provider.mode.synchronous) {
        try {
          ret(this[msg.type].apply(this, args));
        } catch (e) {
          ret(undefined, e.message);
        }
      } else if (port.mode === Provider.mode.asynchronous) {
        this[msg.type].apply(instance, args.concat(ret));
      } else if (port.mode === Provider.mode.promises) {
        this[msg.type].apply(this, args).then(ret, ret.bind({}, undefined));
      }
    }
  }.bind(instance, this, source);
};

/**
 * Get a textual description of this port.
 * @method toString
 * @return {String} the description of this port.
 */
Provider.prototype.toString = function () {
  if (this.emitChannel) {
    return "[Provider " + this.emitChannel + "]";
  } else {
    return "[unbound Provider]";
  }
};

module.exports = Provider;

},{"./proxy":33,"./util":39}],33:[function(require,module,exports){
/*globals Blob, ArrayBuffer, DataView */
/*jslint indent:2, node:true, sloppy:true */
var util = require('./util');

/**
 * A freedom port for a user-accessable proxy.
 * @class Proxy
 * @implements Port
 * @uses handleEvents
 * @param {Object} interfaceCls The proxy interface exposed by this proxy.
 * @param {Debug} debug The debugger to use for logging.
 * @constructor
 */
var Proxy = function (interfaceCls, debug) {
  this.id = Proxy.nextId();
  this.interfaceCls = interfaceCls;
  this.debug = debug;
  util.handleEvents(this);
  
  this.ifaces = {};
  this.closeHandlers = {};
  this.errorHandlers = {};
  this.emits = {};
};

/**
 * Receive incoming messages for this proxy.
 * @method onMessage
 * @param {String} source The source of the message.
 * @param {Object} message The received message.
 */
Proxy.prototype.onMessage = function (source, message) {
  if (source === 'control' && message.reverse) {
    this.emitChannel = message.channel;
    this.emit(this.emitChannel, {
      type: 'channel announcement',
      channel: message.reverse
    });
    this.emit('start');
  } else if (source === 'control' && message.type === 'setup') {
    this.controlChannel = message.channel;
  } else if (source === 'control' && message.type === 'close') {
    delete this.controlChannel;
    this.doClose();
  } else {
    if (!this.emitChannel && message.channel) {
      this.emitChannel = message.channel;
      this.emit('start');
      return;
    }
    if (message.type === 'close' && message.to) {
      this.teardown(message.to);
      return;
    }
    if (message.type === 'error') {
      this.error(message.to, message.message);
      return;
    }
    if (message.to) {
      if (this.emits[message.to]) {
        this.emits[message.to]('message', message.message);
      } else {
        this.debug.warn('Could not deliver message, no such interface: ' + message.to);
      }
    } else {
      var msg = message.message;
      util.eachProp(this.emits, function (iface) {
        iface('message', message.message);
      });
    }
  }
};

/**
 * Create a proxy.Interface associated with this proxy.
 * An interface is returned, which is supplied with important control of the
 * proxy via constructor arguments: (bound below in getInterfaceConstructor)
 * 
 * onMsg: function(binder) sets the function to call when messages for this
 *    interface arrive on the channel,
 * emit: function(msg) allows this interface to emit messages,
 * id: string is the Identifier for this interface.
 * @method getInterface
 */
Proxy.prototype.getInterface = function () {
  var Iface = this.getInterfaceConstructor(),
    args = Array.prototype.slice.call(arguments, 0);
  if (args.length) {
    Iface = Iface.bind.apply(Iface, [Iface].concat(args));
  }
  return new Iface();
};

/**
 * Create a function that can be used to get interfaces from this proxy from
 * a user-visible point.
 * @method getProxyInterface
 */
Proxy.prototype.getProxyInterface = function () {
  var func = function (p) {
    var args = Array.prototype.slice.call(arguments, 1);
    if (args.length > 0) {
      return p.getInterface.apply(p, args);
    } else {
      return p.getInterface();
    }
  }.bind({}, this);

  func.close = function (iface) {
    if (iface) {
      util.eachProp(this.ifaces, function (candidate, id) {
        if (candidate === iface) {
          this.teardown(id);
          this.emit(this.emitChannel, {
            type: 'close',
            to: id
          });
          return true;
        }
      }.bind(this));
    } else {
      // Close the channel.
      this.doClose();
    }
  }.bind(this);

  func.onClose = function (iface, handler) {
    if (typeof iface === 'function' && handler === undefined) {
      // Add an on-channel-closed handler.
      this.once('close', iface);
      return;
    }

    util.eachProp(this.ifaces, function (candidate, id) {
      if (candidate === iface) {
        if (this.closeHandlers[id]) {
          this.closeHandlers[id].push(handler);
        } else {
          this.closeHandlers[id] = [handler];
        }
        return true;
      }
    }.bind(this));
  }.bind(this);

  func.onError = function (iface, handler) {
    if (typeof iface === 'function' && handler === undefined) {
      this.on('error', iface);
      return;
    }
    util.eachProp(this.ifaces, function (candidate, id) {
      if (candidate === iface) {
        if (this.errorHandlers[id]) {
          this.errorHandlers[id].push(handler);
        } else {
          this.errorHandlers[id] = [handler];
        }
        return true;
      }
    }.bind(this));
  }.bind(this);
  
  return func;
};

/**
 * Provides a bound class for creating a proxy.Interface associated
 * with this proxy. This partial level of construction can be used
 * to allow the proxy to be used as a provider for another API.
 * @method getInterfaceConstructor
 * @private
 */
Proxy.prototype.getInterfaceConstructor = function () {
  var id = Proxy.nextId();
  return this.interfaceCls.bind(
    {},
    function (id, obj, binder) {
      this.ifaces[id] = obj;
      this.emits[id] = binder;
    }.bind(this, id),
    this.doEmit.bind(this, id),
    this.debug
  );
};

/**
 * Emit a message on the channel once setup is complete.
 * @method doEmit
 * @private
 * @param {String} to The ID of the flow sending the message.
 * @param {Object} msg The message to emit
 * @param {Boolean} all Send message to all recipients.
 */
Proxy.prototype.doEmit = function (to, msg, all) {
  if (all) {
    to = false;
  }
  if (this.emitChannel) {
    this.emit(this.emitChannel, {to: to, type: 'message', message: msg});
  } else {
    this.once('start', this.doEmit.bind(this, to, msg));
  }
};

/**
 * Teardown a single interface of this proxy.
 * @method teardown
 * @param {String} id The id of the interface to tear down.
 */
Proxy.prototype.teardown = function (id) {
  delete this.emits[id];
  if (this.closeHandlers[id]) {
    util.eachProp(this.closeHandlers[id], function (prop) {
      prop();
    });
  }
  delete this.ifaces[id];
  delete this.closeHandlers[id];
  delete this.errorHandlers[id];
};

/**
 * Handle a message error reported to this proxy.
 * @method error
 * @param {String?} id The id of the interface where the error occured.
 * @param {Object} message The message which failed, if relevant.
 */
Proxy.prototype.error = function (id, message) {
  if (id && this.errorHandlers[id]) {
    util.eachProp(this.errorHandlers[id], function (prop) {
      prop(message);
    });
  } else if (!id) {
    this.emit('error', message);
  }
};


/**
 * Close / teardown the flow this proxy terminates.
 * @method doClose
 */
Proxy.prototype.doClose = function () {
  if (this.controlChannel) {
    this.emit(this.controlChannel, {
      type: 'Channel Closing',
      request: 'close'
    });
  }

  util.eachProp(this.emits, function (emit, id) {
    this.teardown(id);
  }.bind(this));

  this.emit('close');
  this.off();

  this.emitChannel = null;
};

/**
 * Get the textual description of this port.
 * @method toString
 * @return The description of this port.
 */
Proxy.prototype.toString = function () {
  if (this.emitChannel) {
    return "[Proxy " + this.emitChannel + "]";
  } else {
    return "[unbound Proxy]";
  }
};

/**
 * Get the next ID for a proxy channel.
 * @method nextId
 * @static
 * @private
 */
Proxy.nextId = function () {
  if (!Proxy.id) {
    Proxy.id = 1;
  }
  return (Proxy.id += 1);
};

/**
 * Convert a structured data structure into a message stream conforming to
 * a template and an array of binary data elements.
 * @static
 * @method messageToPortable
 * @param {Object} template The template to conform to
 * @param {Object} value The instance of the data structure to confrom
 * @param {Debug} debug A debugger for errors.
 * @return {{text: Object, binary: Array}} Separated data streams.
 */
Proxy.messageToPortable = function (template, value, debug) {
  var externals = [],
    message = Proxy.conform(template, value, externals, true, debug);
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
 * @param {Debug} debug A debugger for errors.
 * @return {Object} The data structure matching the template.
 */
Proxy.portableToMessage = function (template, streams, debug) {
  return Proxy.conform(template, streams.text, streams.binary, false, debug);
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
 * @aparam {Debug} debug A debugger for errors.
 */
Proxy.conform = function (template, from, externals, separate, debug) {
  /* jshint -W086 */
  if (typeof (from) === 'function') {
    //from = undefined;
    //throw "Trying to conform a function";
    return undefined;
  } else if (typeof (from) === 'undefined') {
    return undefined;
  } else if (from === null) {
    return null;
  } else if (template === undefined) {
    debug.error("Message discarded for not matching declared type!", from);
    return undefined;
  }

  switch (template) {
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
        debug.error('conform expecting Blob, but saw ' + (typeof from));
        externals.push(new Blob([]));
        return externals.length - 1;
      }
    } else {
      return externals[from];
    }
  case 'buffer':
    if (separate) {
      externals.push(Proxy.makeArrayBuffer(from, debug));
      return externals.length - 1;
    } else {
      return Proxy.makeArrayBuffer(externals[from], debug);
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
        val.push(Proxy.conform(template[1], from[i], externals,
                                    separate));
      }
    } else {
      for (i = 0; i < template.length; i += 1) {
        if (from[i] !== undefined) {
          val.push(Proxy.conform(template[i], from[i], externals,
                                      separate));
        } else {
          val.push(undefined);
        }
      }
    }
    return val;
  } else if (typeof template === 'object' && from !== undefined) {
    val = {};
    util.eachProp(template, function (prop, name) {
      if (from[name] !== undefined) {
        val[name] = Proxy.conform(prop, from[name], externals, separate);
      }
    });
    return val;
  }
  debug.error('Unknown template provided: ' + template);
};

/**
 * Make a thing into an Array Buffer
 * @static
 * @method makeArrayBuffer
 * @param {Object} thing
 * @param {Debug} debug A debugger in case of errors.
 * @return {ArrayBuffer} An Array Buffer
 */
Proxy.makeArrayBuffer = function (thing, debug) {
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
    debug.error('expecting ArrayBuffer, but saw ' +
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
Proxy.recursiveFreezeObject = function (obj) {
  var k, ret = {};
  if (typeof obj !== 'object') {
    return obj;
  }
  for (k in obj) {
    if (obj.hasOwnProperty(k)) {
      Object.defineProperty(ret, k, {
        value: Proxy.recursiveFreezeObject(obj[k]),
        writable: false,
        enumerable: true
      });
    }
  }
  return ret;
};

module.exports = Proxy;

},{"./util":39}],34:[function(require,module,exports){
/*jslint indent:2, white:true, node:true, sloppy:true, browser:true */
var Promise = require('es6-promise').Promise;

var util = require('../util');
var Proxy = require('../proxy');

var ApiInterface = function(def, onMsg, emit, debug) {
  var inflight = {},
      events = null,
      emitter = null,
      reqId = 0,
      args = arguments;

  util.eachProp(def, function(prop, name) {
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
            streams = Proxy.messageToPortable(prop.value,
                Array.prototype.slice.call(arguments, 0),
                debug);
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
        util.handleEvents(this);
        emitter = this.emit;
        delete this.emit;
        events = {};
      }
      events[name] = prop;
      break;
    case 'constant':
      Object.defineProperty(this, name, {
        value: Proxy.recursiveFreezeObject(prop.value),
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
          resolver.resolve(Proxy.portableToMessage(template, msg, debug));
        }
      } else {
        debug.error('Incoming message claimed to be an RPC ' +
                         'returning for unregistered call', msg.reqId);
      }
    } else if (msg.type === 'event') {
      if (events[msg.name]) {
        emitter(msg.name, Proxy.portableToMessage(events[msg.name].value,
                msg, debug));
      }
    }
  }.bind(this));

  args = Proxy.messageToPortable(
      (def.constructor && def.constructor.value) ? def.constructor.value : [],
      Array.prototype.slice.call(args, 4),
      debug);

  emit({
    type: 'construct',
    text: args.text,
    binary: args.binary
  });
};

module.exports = ApiInterface;

},{"../proxy":33,"../util":39,"es6-promise":1}],35:[function(require,module,exports){
module.exports=require(34)
},{"../proxy":33,"../util":39,"es6-promise":1}],36:[function(require,module,exports){
/*jslint indent:2, white:true, node:true, sloppy:true, browser:true */
var util = require('../util');

var EventInterface = function(onMsg, emit, debug) {
  util.handleEvents(this);
  
  onMsg(this, function(emit, type, msg) {
    emit(msg.type, msg.message);
  }.bind(this, this.emit));

  this.emit = function(emitter, type, msg) {
    emitter({type: type, message: msg}, true);
  }.bind({}, emit);
};

module.exports = EventInterface;

},{"../util":39}],37:[function(require,module,exports){
/*jslint indent:2, node:true */
var Promise = require('es6-promise').Promise;

var ApiInterface = require('./proxy/apiInterface');
var EventInterface = require('./proxy/eventInterface');
var Provider = require('./provider');
var Proxy = require('./proxy');

/**
 * A Proxy Binder manages the external interface, and creates one of
 * the different types of objects exposed by freedom either as a global
 * within a worker / module context, or returned by an external call to
 * create a freedom runtime.
 * @Class ProxyBinder
 * @param {Manager} manager The manager for the active runtime.
 */
var ProxyBinder = function (manager) {
  'use strict';
  this.manager = manager;
};

/**
 * Create a proxy for a freedom port, and return it once loaded.
 * @method getExternal
 * @param {Port} port The port for the proxy to communicate with.
 * @param {String} name The name of the proxy.
 * @param {Object} [definition] The definition of the API to expose.
 * @param {String} definition.name The name of the API.
 * @param {Object} definition.definition The definition of the API.
 * @param {Boolean} definition.provides Whether this is a consumer or provider.
 * @returns {Promise} A promise for the active proxy interface.
 */
ProxyBinder.prototype.getExternal = function (port, name, definition) {
  'use strict';
  var proxy, api;
  return new Promise(function (resolve, reject) {
    if (definition) {
      api = definition.name;
      if (definition.provides) {
        proxy = new Provider(definition.definition, this.manager.debug);
      } else {
        proxy = new Proxy(ApiInterface.bind({},
            definition.definition),
            this.manager.debug);
      }
    } else {
      proxy = new Proxy(EventInterface, this.manager.debug);
    }

    proxy.once('start', function () {
      var iface = proxy.getProxyInterface();
      if (api) {
        iface.api = api;
      }
      resolve({
        port: proxy,
        external: iface
      });
    });

    this.manager.createLink(port, name, proxy);
  }.bind(this));
};

/**
 * Bind the default proxy for a freedom port.
 * @method bindDefault
 * @param {Port} port The port for the proxy to communicate with.
 * @param {Api} api The API loader with API definitions.
 * @param {Object} manifest The manifest of the module to expose.
 * @param {Boolean} internal Whether the interface is for inside the module.
 * @returns {Promise} A promise for a proxy interface.
 * @private
 */
ProxyBinder.prototype.bindDefault = function (port, api, manifest, internal) {
  'use strict';
  var metadata = {
    name: manifest.name,
    icon: manifest.icon,
    description: manifest.description
  }, def;

  if (manifest['default']) {
    def = api.get(manifest['default']);
    if (!def && manifest.api && manifest.api[manifest['default']]) {
      def = {
        name: manifest['default'],
        definition: manifest.api[manifest['default']]
      };
    }
    if (internal && manifest.provides &&
        manifest.provides.indexOf(manifest['default']) !== false) {
      def.provides = true;
    } else if (internal) {
      api.debug.warn("default API not provided, " +
                     "are you missing a provides key in your manifest?");
    }
  }

  return this.getExternal(port, 'default', def).then(
    function (metadata, info) {
      info.external.manifest = metadata;
      return info;
    }.bind(this, metadata)
  );
};

module.exports = ProxyBinder;

},{"./provider":32,"./proxy":33,"./proxy/apiInterface":34,"./proxy/eventInterface":36,"es6-promise":1}],38:[function(require,module,exports){
/*globals XMLHttpRequest */
/*jslint indent:2,node:true,sloppy:true */
var Promise = require('es6-promise').Promise;

var util = require('./util');

/**
 * The Resource registry for FreeDOM.  Used to look up requested Resources,
 * and provide lookup and migration of resources.
 * @Class Resource
 * @param {Debug} debug The logger to use for debugging.
 * @constructor
 */
var Resource = function (debug) {
  this.debug = debug;
  this.files = {};
  this.resolvers = [this.httpResolver, this.nullResolver];
  this.contentRetrievers = {
    'http': this.xhrRetriever,
    'https': this.xhrRetriever,
    'chrome-extension': this.xhrRetriever,
    'resource': this.xhrRetriever,
    'chrome': this.xhrRetriever,
    'manifest': this.manifestRetriever
  };
};

/**
 * Resolve a resurce URL requested from a module.
 * @method get
 * @param {String} manifest The canonical address of the module requesting.
 * @param {String} url The resource to get.
 * @returns {Promise} A promise for the resource address.
 */
Resource.prototype.get = function (manifest, url) {
  var key = JSON.stringify([manifest, url]);
  
  return new Promise(function (resolve, reject) {
    if (this.files[key]) {
      resolve(this.files[key]);
    } else {
      this.resolve(manifest, url).then(function (key, resolve, address) {
        this.files[key] = address;
        //fdom.debug.log('Resolved ' + key + ' to ' + address);
        resolve(address);
      }.bind(this, key, resolve), reject);
    }
  }.bind(this));
};

/**
 * Get the contents of a resource.
 * @method getContents
 * @param {String} url The resource to read.
 * @returns {Promise} A promise for the resource contents.
 */
Resource.prototype.getContents = function (url) {
  return new Promise(function (resolve, reject) {
    var prop;
    if (!url) {
      this.debug.warn("Asked to get contents of undefined URL.");
      return reject();
    }
    for (prop in this.contentRetrievers) {
      if (this.contentRetrievers.hasOwnProperty(prop)) {
        if (url.indexOf(prop + "://") === 0) {
          return this.contentRetrievers[prop](url, resolve, reject);
        }
      }
    }
    reject();
  }.bind(this));
};

/**
 * Resolve a resource using known resolvers. Unlike get, resolve does
 * not cache resolved resources.
 * @method resolve
 * @private
 * @param {String} manifest The module requesting the resource.
 * @param {String} url The resource to resolve;
 * @returns {Promise} A promise for the resource address.
 */
Resource.prototype.resolve = function (manifest, url) {
  return new Promise(function (resolve, reject) {
    var promises = [];
    if (url === undefined) {
      return reject();
    }
    util.eachReverse(this.resolvers, function (resolver) {
      promises.push(new Promise(resolver.bind({}, manifest, url)));
    }.bind(this));
    //TODO this would be much cleaner if Promise.any existed
    Promise.all(promises).then(function (values) {
      var i;
      for (i = 0; i < values.length; i += 1) {
        if (typeof values[i] !== 'undefined' && values[i] !== false) {
          resolve(values[i]);
          return;
        }
      }
      reject('No resolvers to handle url: ' + JSON.stringify([manifest, url]));
    });
  }.bind(this));
};

/**
 * Register resolvers: code that knows how to get resources
 * needed by the runtime. A resolver will be called with four
 * arguments: the absolute manifest of the requester, the
 * resource being requested, and a resolve / reject pair to
 * fulfill a promise.
 * @method addResolver
 * @param {Function} resolver The resolver to add.
 */
Resource.prototype.addResolver = function (resolver) {
  this.resolvers.push(resolver);
};

/**
 * Register retrievers: code that knows how to load resources
 * needed by the runtime. A retriever will be called with a URL
 * to retrieve with a protocol that it is able to handle.
 * @method addRetriever
 * @param {String} proto The protocol to register for.
 * @param {Function} retriever The retriever to add.
 */
Resource.prototype.addRetriever = function (proto, retriever) {
  if (this.contentRetrievers[proto]) {
    this.debug.warn("Unwilling to override file retrieval for " + proto);
    return;
  }
  this.contentRetrievers[proto] = retriever;
};

/**
 * Determine if a URL is an absolute URL of a given Scheme.
 * @method hasScheme
 * @static
 * @private
 * @param {String[]} protocols Whitelisted protocols
 * @param {String} URL the URL to match.
 * @returns {Boolean} If the URL is an absolute example of one of the schemes.
 */
Resource.hasScheme = function (protocols, url) {
  var i;
  for (i = 0; i < protocols.length; i += 1) {
    if (url.indexOf(protocols[i] + "://") === 0) {
      return true;
    }
  }
  return false;
};

/**
 * Remove './' and '../' from a URL
 * Required because Chrome Apps for Mobile (cca) doesn't understand
 * XHR paths with these relative components in the URL.
 * @method removeRelativePath
 * @param {String} url The URL to modify
 * @returns {String} url without './' and '../'
 **/
Resource.removeRelativePath = function (url) {
  var idx = url.indexOf("://") + 3,
    stack,
    toRemove,
    result;
  // Remove all instances of /./
  url = url.replace(/\/\.\//g, "/");
  //Weird bug where in cca, manifest starts with 'chrome:////'
  //This forces there to only be 2 slashes
  while (url.charAt(idx) === "/") {
    url = url.slice(0, idx) + url.slice(idx + 1, url.length);
  }

  // Advance to next /
  idx = url.indexOf("/", idx);
  // Removing ../
  stack = url.substr(idx + 1).split("/");
  while (stack.indexOf("..") !== -1) {
    toRemove = stack.indexOf("..");
    if (toRemove === 0) {
      stack.shift();
    } else {
      stack.splice((toRemove - 1), 2);
    }
  }
  
  //Rebuild string
  result = url.substr(0, idx);
  for (idx = 0; idx < stack.length; idx += 1) {
    result += "/" + stack[idx];
  }
  return result;
};

/**
 * Resolve URLs which can be accessed using standard HTTP requests.
 * @method httpResolver
 * @private
 * @param {String} manifest The Manifest URL.
 * @param {String} url The URL to resolve.
 * @param {Function} resolve The promise to complete.
 * @param {Function} reject The promise to reject.
 * @returns {Boolean} True if the URL could be resolved.
 */
Resource.prototype.httpResolver = function (manifest, url, resolve, reject) {
  var protocols = ["http", "https", "chrome", "chrome-extension", "resource"],
    dirname,
    protocolIdx,
    pathIdx,
    path,
    base,
    result;

  if (Resource.hasScheme(protocols, url)) {
    resolve(Resource.removeRelativePath(url));
    return true;
  }
  
  if (!manifest) {
    resolve(false);
    return false;
  }
  if (Resource.hasScheme(protocols, manifest) &&
      url.indexOf("://") === -1) {
    dirname = manifest.substr(0, manifest.lastIndexOf("/"));
    protocolIdx = dirname.indexOf("://");
    pathIdx = protocolIdx + 3 + dirname.substr(protocolIdx + 3).indexOf("/");
    path = dirname.substr(pathIdx);
    base = dirname.substr(0, pathIdx);
    if (url.indexOf("/") === 0) {
      resolve(Resource.removeRelativePath(base + url));
    } else {
      resolve(Resource.removeRelativePath(base + path + "/" + url));
    }
    return true;
  }
  resolve(false);
  return false;
};

/**
 * Resolve URLs which are self-describing.
 * @method nullResolver
 * @private
 * @param {String} manifest The Manifest URL.
 * @param {String} url The URL to resolve.
 * @param {Function} resolve The promise to complete.
 * @param {Function} reject The promise to reject.
 * @returns {Boolean} True if the URL could be resolved.
 */
Resource.prototype.nullResolver = function (manifest, url, resolve, reject) {
  var protocols = ["manifest"];
  if (Resource.hasScheme(protocols, url)) {
    resolve(url);
    return true;
  } else if (url.indexOf('data:') === 0) {
    resolve(url);
    return true;
  }
  resolve(false);
  return false;
};

/**
 * Retrieve manifest content from a self-descriptive manifest url.
 * These urls are used to reference a manifest without requiring subsequent,
 * potentially non-CORS requests.
 * @method manifestRetriever
 * @private
 * @param {String} manifest The Manifest URL
 * @param {Function} resolve The promise to complete.
 * @param {Function} reject The promise to reject.
 */
Resource.prototype.manifestRetriever = function (manifest, resolve, reject) {
  var data;
  try {
    data = manifest.substr(11);
    JSON.parse(data);
    resolve(data);
  } catch (e) {
    this.debug.warn("Invalid manifest URL referenced:" + manifest);
    reject();
  }
};

/**
 * Retrieve resource contents using an XHR request.
 * @method xhrRetriever
 * @private
 * @param {String} url The resource to fetch.
 * @param {Function} resolve The promise to complete.
 * @param {Function} reject The promise to reject.
 */
Resource.prototype.xhrRetriever = function (url, resolve, reject) {
  var ref = new XMLHttpRequest();
  ref.addEventListener("readystatechange", function (resolve, reject) {
    if (ref.readyState === 4 && ref.responseText) {
      resolve(ref.responseText);
    } else if (ref.readyState === 4) {
      this.debug.warn("Failed to load file " + url + ": " + ref.status);
      reject(ref.status);
    }
  }.bind(this, resolve, reject), false);
  ref.overrideMimeType("application/json");
  ref.open("GET", url, true);
  ref.send();
};

module.exports = Resource;

},{"./util":39,"es6-promise":1}],39:[function(require,module,exports){
/*globals crypto, WebKitBlobBuilder, Blob, URL */
/*globals webkitURL, Uint8Array, Uint16Array, ArrayBuffer */
/*jslint indent:2,white:true,browser:true,node:true,sloppy:true */

/**
 * Utility method used within the freedom Library.
 * @class util
 * @static
 */
var util = {};


/**
 * Helper function for iterating over an array backwards. If the func
 * returns a true value, it will break out of the loop.
 * @method eachReverse
 * @static
 */
util.eachReverse = function(ary, func) {
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
util.hasProp = function(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
};

/**
 * Cycles over properties in an object and calls a function for each
 * property value. If the function returns a truthy value, then the
 * iteration is stopped.
 * @method eachProp
 * @static
 */
util.eachProp = function(obj, func) {
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
util.mixin = function(target, source, force) {
  if (source) {
    util.eachProp(source, function (value, prop) {
      if (force || !util.hasProp(target, prop)) {
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
util.getId = function() {
  var guid = 'guid',
      domain = 12,
      buffer;
  if (typeof crypto === 'object') {
    buffer = new Uint8Array(domain);
    crypto.getRandomValues(buffer);
    util.eachReverse(buffer, function(n) {
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
 * Encode a string into a binary array buffer, by treating each character as a
 * utf16 encoded character - the native javascript encoding.
 * @method str2ab
 * @static
 * @param {String} str The string to encode.
 * @returns {ArrayBuffer} The encoded string.
 */
util.str2ab = function(str) {
  var length = str.length,
      buffer = new ArrayBuffer(length * 2), // 2 bytes for each char
      bufferView = new Uint16Array(buffer),
      i;
  for (i = 0; i < length; i += 1) {
    bufferView[i] = str.charCodeAt(i);
  }

  return buffer;
};

/**
 * Convert an array buffer containing an encoded string back into a string.
 * @method ab2str
 * @static
 * @param {ArrayBuffer} buffer The buffer to unwrap.
 * @returns {String} The decoded buffer.
 */
util.ab2str = function(buffer) {
  return String.fromCharCode.apply(null, new Uint16Array(buffer));
};

/**
 * Add 'on' and 'emit' methods to an object, which act as a light weight
 * event handling structure.
 * @class handleEvents
 * @static
 */
util.handleEvents = function(obj) {
  var eventState = {
    multiple: {},
    maybemultiple: [],
    single: {},
    maybesingle: []
  }, filter, push;

  /**
   * Filter a list based on a predicate. The list is filtered in place, with
   * selected items removed and returned by the function.
   * @method
   * @param {Array} list The list to filter
   * @param {Function} predicate The method to run on each item.
   * @returns {Array} Selected items
   */
  filter = function(list, predicate) {
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
   * Enqueue a handler for a specific type.
   * @method
   * @param {String} to The queue ('single' or 'multiple') to queue on.
   * @param {String} type The type of event to wait for.
   * @param {Function} handler The handler to enqueue.
   */
  push = function(to, type, handler) {
    if (typeof type === 'function') {
      this['maybe' + to].push([type, handler]);
    } else if (this[to][type]) {
      this[to][type].push(handler);
    } else {
      this[to][type] = [handler];
    }
  };

  /**
   * Register a method to be executed when an event of a specific type occurs.
   * @method on
   * @param {String|Function} type The type of event to register against.
   * @param {Function} handler The handler to run when the event occurs.
   */
  obj.on = push.bind(eventState, 'multiple');

  /**
   * Register a method to be execute the next time an event occurs.
   * @method once
   * @param {String|Function} type The type of event to wait for.
   * @param {Function} handler The handler to run the next time a matching event
   *     is raised.
   */
  obj.once = push.bind(eventState, 'single');

  /**
   * Emit an event on this object.
   * @method emit
   * @param {String} type The type of event to raise.
   * @param {Object} data The payload of the event.
   */
  obj.emit = function(type, data) {
    var i, queue;
    if (this.multiple[type]) {
      for (i = 0; i < this.multiple[type].length; i += 1) {
        if (this.multiple[type][i](data) === false) {
          return;
        }
      }
    }
    if (this.single[type]) {
      queue = this.single[type];
      this.single[type] = [];
      for (i = 0; i < queue.length; i += 1) {
        queue[i](data);
      }
    }
    for (i = 0; i < this.maybemultiple.length; i += 1) {
      if (this.maybemultiple[i][0](type, data)) {
        this.maybemultiple[i][1](data);
      }
    }
    for (i = this.maybesingle.length - 1; i >= 0; i -= 1) {
      if (this.maybesingle[i][0](type, data)) {
        queue = this.maybesingle.splice(i, 1);
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
  obj.off = function(type, handler) {
    if (!type) {
      this.multiple = {};
      this.maybemultiple = [];
      this.single = {};
      this.maybesingle = [];
      return;
    }

    if (typeof type === 'function') {
      filter(this.maybesingle, function(item) {
        return item[0] === type && (!handler || item[1] === handler);
      });
      filter(this.maybemultiple, function(item) {
        return item[0] === type && (!handler || item[1] === handler);
      });
    }

    if (!handler) {
      delete this.multiple[type];
      delete this.single[type];
    } else {
      filter(this.multiple[type], function(item) {
        return item === handler;
      });
      filter(this.single[type], function(item) {
        return item === handler;
      });
    }
  }.bind(eventState);
};

/**
 * When run without a window, or specifically requested.
 * Note: Declaration can be redefined in forceModuleContext below.
 * @method isModuleContext
 * @for util
 * @static
 */
/*!@preserve StartModuleContextDeclaration*/
util.isModuleContext = function() {
  return (typeof document === 'undefined');
};

/**
 * Provide a version of src where the 'isModuleContext' function will return
 * true. Used for creating module contexts which may not be able to determine
 * that they need to start up in that mode by themselves.
 * @method forceModuleContext
 * @static
 */
util.forceModuleContext = function(src) {
  var definition = "function () { return true; }",
      idx = src.indexOf('StartModuleContextDeclaration'),
      funcidx = src.indexOf('function', idx),
      source,
      blob;
  if (idx === -1 || funcidx === -1) {
    return;
  }
  source = src.substr(0, funcidx) +  definition + ' || ' +
      src.substr(funcidx);
  blob = util.getBlob(source, 'text/javascript');
  return util.getURL(blob);
};

/**
 * Get a Blob object of a string.
 * Polyfills implementations which don't have a current Blob constructor, like
 * phantomjs.
 * @method getBlob
 * @static
 */
util.getBlob = function(data, type) {
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
util.getURL = function(blob) {
  if (typeof URL !== 'object' && typeof webkitURL !== 'undefined') {
    return webkitURL.createObjectURL(blob);
  } else {
    return URL.createObjectURL(blob);
  }
};

/**
 * Find all scripts on the given page.
 * @method scripts
 * @static
 */
util.scripts = function(global) {
  return global.document.getElementsByTagName('script');
};

module.exports = util;

},{}]},{},[12,13,14,15,16,17,18,19,20,21,22]);