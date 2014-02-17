describe("fdom.proxy.APIInterface", function() {
  var emit, reg, api;
  beforeEach(function() {
        var iface = {
      'test': {'type': 'method', 'value': ['string']},
      'ev': {'type': 'event', 'value': 'string'},
      'co': {'type': 'constant', 'value': '12'}
    };
    emit = jasmine.createSpy('emit');
    var onMsg = function(obj, r) {
      reg = r;
    };
    api = new fdom.proxy.ApiInterface(iface, onMsg, emit);
  });

  it("Creates an object looking like an interface.", function(done) {
    expect(typeof(api.test)).toEqual('function');
    expect(typeof(api.on)).toEqual('function');
    expect(api.co).toEqual('12');

    expect(emit).not.toHaveBeenCalledWith({
      'action': 'construct'
    });
    var promise = api.test('hi');
    expect(emit).toHaveBeenCalledWith({
      action: 'method',
      type: 'test',
      reqId: 0,
      value: ['hi'] });

    var spy = jasmine.createSpy('ret');
    promise.then(spy);
    expect(spy).not.toHaveBeenCalled();

    reg('message', {
      type: 'method',
      reqId: 0,
      value: 'boo!'
    });
    setTimeout(function() {
      expect(spy).toHaveBeenCalledWith('boo!');
      done();
    }, 0);
  });

  it("delivers events", function() {
    var cb = jasmine.createSpy('cb');
    api.on('ev', cb);
    expect(cb).not.toHaveBeenCalled();

    reg('message', {
      'type': 'event',
      'name': 'ev',
      'value': 'boo!'
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

describe("fdom.proxy.recursiveFreezeObject", function() {
  it("Freezes objects", function () {
    var obj = {
      a: 1,
      b: {
        c: 2
      }
    };
    var frozen = fdom.proxy.recursiveFreezeObject(obj);
    frozen.a = 5;
    frozen.b = 5;
    frozen.c = 5;
    expect(frozen.a).toEqual(1);
    expect(frozen.b.c).toEqual(2);
  });
});

describe("fdom.proxy.conform", function() {
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
      'p3': 'bool',
      'p4': 'object',
      'p5': 'blob',
      'p6': 'buffer',
      'p7': 'data',
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
      'p5': blob,
      'p6': new ArrayBuffer(2),
      'p7': 'data',
      'p8': ['app', 'flow', 'id'],
      'p9': ['string', 'string2', 'string3'],
      'p10': ['test', 12],
      'p11': {'a': 'hi', 'b': 12}
    };
    var conformed = fdom.proxy.conform(template, correct);
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

    conformed = fdom.proxy.conform(template, incorrect);
    expect(conformed).toEqual({
      'p1': '12',
      'p2': 12,
      'p3': false,
      'p4': [1,2,3],
      'p6': conformed.p6,
      'p8': undefined,
      'p9': ['1', '[object Object]'],
      'p10': ['true', undefined],
      'p11': {}
    });
  });

  it("conforms simple arguments", function() {
    expect(fdom.proxy.conform("string", "mystring")).toEqual("mystring");
    expect(fdom.proxy.conform("number", "mystring")).toEqual(jasmine.any(Number));
    expect(fdom.proxy.conform("bool", "mystring")).toEqual(false);
    expect(fdom.proxy.conform("", "mystring")).toEqual(undefined);
    expect(fdom.proxy.conform("number", 0)).toEqual(0);
  });

  it("conforms complex arguments", function() {
    expect(fdom.proxy.conform({"key":"string"}, {"key":"good", "other":"bad"})).
        toEqual({"key":"good"});
    expect(fdom.proxy.conform(["string"], ["test", 12])).toEqual(["test"]);
    expect(fdom.proxy.conform(["array", "string"], ["test", 12])).toEqual(["test", "12"]);
    expect(fdom.proxy.conform("object", {"simple":"string"})).toEqual({"simple": "string"});
    expect(fdom.proxy.conform.bind({}, "object", function() {})).toThrow();
  });

  it("conforms binary arguments", function() {
    // TODO: test Blob support (API is nonstandard between Node and Browsers)
    /*
     * var blob = new Blob(["test"]);
     * expect(conform("blob", blob)).toEqual(blob);
     * expect(conform("blob", "string")).toEqual(jasmine.any(Blob));
     */

    var buffer = new ArrayBuffer(4);
    expect(fdom.proxy.conform("buffer", buffer)).toEqual(buffer);
    expect(fdom.proxy.conform("buffer", "string")).toEqual(jasmine.any(ArrayBuffer));
  });
});
