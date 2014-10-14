var ApiInterface = require('../../src/proxy/apiInterface');
var Consumer = require('../../src/consumer');

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

describe("Consumer.recursiveFreezeObject", function() {
  it("Freezes objects", function () {
    var obj = {
      a: 1,
      b: {
        c: 2
      }
    };
    var frozen = Consumer.recursiveFreezeObject(obj);
    frozen.a = 5;
    frozen.b = 5;
    frozen.c = 5;
    expect(frozen.a).toEqual(1);
    expect(frozen.b.c).toEqual(2);
  });
});

describe("Consumer.conform", function() {
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
    var conformed = Consumer.conform(template, correct,
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

    conformed = Consumer.conform(template, incorrect, [0, blob, blob], false);
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
    expect(Consumer.conform("string", "mystring", [], false, debug)).toEqual("mystring");
    expect(Consumer.conform("number", "mystring", [], false, debug)).toEqual(jasmine.any(Number));
    expect(Consumer.conform("boolean", "mystring", [], false, debug)).toEqual(false);
    expect(Consumer.conform("", "mystring", [], false, debug)).toEqual(undefined);
    expect(Consumer.conform(["string", "number"], ["test", 0], [], false, debug))
      .toEqual(["test", 0]);
    expect(Consumer.conform("number", 0, [], false, debug)).toEqual(0);
  });

  it("conforms complex arguments", function() {
    expect(Consumer.conform({"key":"string"}, {"key":"good", "other":"bad"},[], false)).
        toEqual({"key":"good"});
    expect(Consumer.conform(["string"], ["test", 12],[], false)).toEqual(["test"]);
    expect(Consumer.conform(["array", "string"], ["test", 12],[], false)).toEqual(["test", "12"]);
    expect(Consumer.conform("object", {"simple":"string"},[], false)).toEqual({"simple": "string"});
    //expect(fdom.proxy.conform.bind({}, "object", function() {},[], false)).toThrow();
    expect(Consumer.conform("object", function() {},[], false)).not.toBeDefined();
  });

  it("conforms nulls", function() {
    expect(Consumer.conform({"key": "string"}, {"key": null}, [], false)).
      toEqual({"key": null});
    expect(Consumer.conform("object", null, [], false)).toEqual(null);
    expect(Consumer.conform({"key": "string"}, {"key": undefined}, [], false)).
      toEqual({});
    expect(Consumer.conform(["string", "string", "string", "string"], 
                              [null, undefined, null, 0], [], false)).
      toEqual([null, undefined, null, "0"]);
    expect(Consumer.conform("object", undefined, [], false)).toEqual(undefined);
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
    expect(Consumer.conform("buffer", buffer, externals, true, debug)).toEqual(0);
    expect(externals.length).toEqual(1);
    expect(Consumer.conform("buffer", 0, ["string"], false, debug)).toEqual(jasmine.any(ArrayBuffer));
    expect(Consumer.conform("buffer", 0, externals, false, debug)).toEqual(buffer);
  });
});
