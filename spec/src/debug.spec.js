var Debug = require('../../src/debug.js');
var PromiseCompat = require('es6-promise').Promise;

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

  it("Exports a synchronous logger", function (done) {
    var resolve;
    var promise = new PromiseCompat(function (r) {resolve = r;});
    var syncLogger = debug.getLoggingShim(function (name) {
      expect(name).toEqual('my Name');
      return promise;
    });
    var logger = syncLogger('my Name');
    logger.log('log 1');
    promise.then(function () {
      logger.warn('log 2');
    });

    var loggedItem1 = false;
    resolve({
      log: function(item) {
        expect(item).toEqual('log 1');
        loggedItem1 = true;
      },
      warn: function(item) {
        expect(item).toEqual('log 2');
        expect(loggedItem1).toEqual(true);
        done();
      }
    });
  });
});
