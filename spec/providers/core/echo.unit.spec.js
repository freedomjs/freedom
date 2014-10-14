var testUtil = require('../../util');
var Util = require('../../../src/util');
var Echo = require('../../../providers/core/echo.unprivileged');

describe("providers/core/Echo_Unprivileged", function() {
  var app;
  var echo;

  beforeEach(function() {
    app = testUtil.createTestPort('test');
    app.controlChannel = 'control';
    echo = new Echo.provider(app, app.emit.bind(app));
  });

  it("Needs core", function() {
    var spy = jasmine.createSpy('msg');
    app.on('message', spy);
    echo.setup('test', function() {});
    expect(spy).toHaveBeenCalled();
  });
  
  it("Binds a custom channel", function() {
    var spy = jasmine.createSpy('msg');
    app.on('message', spy);

    var args;
    app.emit('core', function() {
      this.bindChannel = function(id, cb) {
        args = [id, cb];
      }
    });

    echo.setup('test', function() {});
    expect(spy).not.toHaveBeenCalled();
    expect(args[0]).toEqual('test');
    
    var chan = {};
    Util.handleEvents(chan);
    chan.onClose = function(c) {};
    
    args[1](chan);
    expect(spy).toHaveBeenCalled();

    chan.emit('message', 'test1');
    expect(spy).toHaveBeenCalledWith('from custom channel: test1');
  });

  it("Rebinds the channel", function() {
    var args;
    app.emit('core', function() {
      this.bindChannel = function(id, cb) {
        args = [id, cb];
      }
    });

    echo.setup('test', function() {});
    expect(args[0]).toEqual('test');
    
    var chan = {};
    Util.handleEvents(chan);
    chan.onClose = function(c) {};
    chan.close = jasmine.createSpy('close');
    
    args[1](chan);
    args[1](chan);
    expect(chan.close).toHaveBeenCalled();
  });
});
