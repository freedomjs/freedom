describe("fdom.Port.Debug", function() {
  var debug;

  beforeEach(function() {
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

  it("Allows filtering of Messages", function() {
    var console = jasmine.createSpy('console');
    fdom.debug.console = {log: console};
    var msg = {
      severity: 'log',
      source: null,
      msg: JSON.stringify(["My Message"])
    }
    fdom.debug.print(msg);
    expect(console).not.toHaveBeenCalled();

    fdom.debug.config = true;
    fdom.debug.print(msg);
    expect(console).toHaveBeenCalled();

    fdom.debug.config = 'keyword';
    fdom.debug.print(msg);
    expect(console.calls.count()).toEqual(1);

    fdom.debug.config = 'My';
    fdom.debug.print(msg);
    expect(console.calls.count()).toEqual(2);
  });

  it("Filters on source", function() {
    var console = jasmine.createSpy('console');
    fdom.debug.console = {log: console};
    var msg = {
      severity: 'log',
      source: "src1",
      msg: JSON.stringify(["My Message"])
    }
    fdom.debug.print(msg);
    expect(console).not.toHaveBeenCalled();

    fdom.debug.config = 'source:test';
    fdom.debug.print(msg);
    expect(console).not.toHaveBeenCalled();

    fdom.debug.config = 'source:src1';
    fdom.debug.print(msg);
    expect(console).toHaveBeenCalled();

  });
});