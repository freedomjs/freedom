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

  it("Creates an object looking like an interface.", function() {
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
    promise.done(spy);
    expect(spy).not.toHaveBeenCalled();

    reg('message', {
      type: 'method',
      reqId: 0,
      value: 'boo!'
    });
    expect(spy).toHaveBeenCalledWith('boo!');
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

describe("fdom.proxy.conform", function() {
  it("Conforms Simple values to templates", function() {
    var blob = null;
    if (typeof(Blob) === typeof(Function)) {
      blob = new Blob(2);
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
});
