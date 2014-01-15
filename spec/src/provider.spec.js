describe("fdom.Port.Provider", function() {
  var port, o, constructspy;
  beforeEach(function() {
    var definition = {
      'm1': {type: 'method', value:['string']},
      'm2': {type: 'method', value:[{'name':'string'}]},
      'e1': {type: 'event', value:'string'},
      'c1': {type: 'constant', value:"test_constant"}
    };
    port = new fdom.port.Provider(definition);

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
