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
