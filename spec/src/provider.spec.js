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
    port = new Provider(definition, {
      warn: function(x) {console.error(x);}
    });

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

  it("allows null reqId", function(done) {
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
      'reqId': null
    }});

    expect(called).toEqual(true);

    port.on('message', function(n) {
      // There should be no return message because reqId is null.
      expect(n).toBe(undefined);
    });

    setTimeout(done, 100);
  });

  it("rejects method calls when the provider errors", function (done) {
    var iface = port.getInterface();
    var o = function() {};
    o.prototype.m1 = function(str) {
      throw new Error('hi.myerr');
    };

    iface.providePromises(o);
    port.onMessage('default', {
      channel: 'message'
    });

    port.onMessage('default', {to: 'testInst', type:'message', message:{
      'type': 'construct',
    }});

    port.on('message', function(n) {
      expect(n.message.error).toContain('hi.myerr');
      done();
    });

    port.onMessage('default', {to: 'testInst', type:'message', message: {
      'action': 'method',
      'type': 'm1',
      'text': ['mystr'],
      'reqId': 1
    }});
  });

  it("rejects method calls when the provider doesn't return a promise", function (done) {
    var iface = port.getInterface();
    var o = function() {};
    o.prototype.m1 = function(str) {
      return 'a weird return';
    };

    iface.providePromises(o);
    port.onMessage('default', {
      channel: 'message'
    });

    port.onMessage('default', {to: 'testInst', type:'message', message:{
      'type': 'construct',
    }});

    port.on('message', function(n) {
      expect(n.message.error).toContain('a weird return');
      done();
    });

    port.onMessage('default', {to: 'testInst', type:'message', message: {
      'action': 'method',
      'type': 'm1',
      'text': ['mystr'],
      'reqId': 1
    }});
  });

  it("rejects method calls when the provider doesn't exist", function (done) {
    var iface = port.getInterface();
    var o = function() {};

    iface.providePromises(o);
    port.onMessage('default', {
      channel: 'message'
    });

    port.onMessage('default', {to: 'testInst', type:'message', message:{
      'type': 'construct',
    }});

    port.on('message', function(n) {
      expect(n.message.error.length).toBeGreaterThan(0);
      done();
    });

    port.onMessage('default', {to: 'testInst', type:'message', message: {
      'action': 'method',
      'type': 'm1',
      'text': ['mystr'],
      'reqId': 1
    }});
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
