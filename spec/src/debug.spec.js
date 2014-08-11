describe("fdom.Port.Debug", function() {
  var debug, activeLogger, onLogger;
  var logger = function() {
    activeLogger = this;
    this.spy = jasmine.createSpy('log');
    this.log = function() {
      this.spy(arguments[0], arguments[1]);
      onLogger();
    }
    this.warn = function() {
      this.spy(arguments[0], arguments[1]);
      onLogger();
    }
  };

  beforeEach(function() {
    fdom.apis.register('core.logger', logger);
    fdom.debug = new fdom.port.Debug();
  });

  it("Relays Messages", function() {
    var spy = jasmine.createSpy('cb');
    fdom.debug.on('msg', spy);

    fdom.debug.log('test1');
    fdom.debug.warn('test2');
    fdom.debug.error('test3');
    fdom.debug.format('log', 'source', 'message');
    expect(spy).not.toHaveBeenCalled();

    fdom.debug.onMessage('control', {
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
    fdom.debug.console = {log: console};
    var msg = {
      severity: 'log',
      source: null,
      msg: JSON.stringify(["My Message"])
    }
    fdom.debug.print(msg);
    onLogger = function() {
      expect(activeLogger.log).toBeDefined();
      expect(activeLogger.spy).toHaveBeenCalledWith(null, ["My Message"]);
      done();
      onLogger = function() {};
    };
  });
});