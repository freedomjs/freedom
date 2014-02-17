describe("fdom.apis", function() {
  var api;

  beforeEach(function() {
    api = new Api();
    fdom.debug = new fdom.port.Debug();
  });

  it("should return registered providers", function() {
    var provider = {id: "test"};
    api.set('customName', provider);
    expect(api.get('customName').definition).toEqual(provider);
    expect(api.get('customName').name).toEqual('customName');
    expect(api.get('otherName')).toBeFalsy();
  });

  it("should not allow core providers without an API.", function(done) {
    var provider = function() {};

    api.register('customCore', provider);
    var channel = api.getCore('customCore', null);
    channel.then(function() {}, function() {
      done();
    });
  });

  it("should register core providers", function(done) {
    var provider = function(arg) { this.arg = arg };

    api.set('customCore', provider);
    api.register('customCore', provider);
    var channel = api.getCore('customCore', 12);
    channel.then(function(prov) {
      var obj = new prov();
      expect(obj.arg).toEqual(12);
      done();
    });
  });

  it("allows late registration of core providers", function() {
    var provider = function(arg) { this.arg = arg };

    api.set('customCore', provider);
    var channel = api.getCore('customCore', 12);

    var arg = 0;
    channel.then(function(prov) {
      var mine = new prov();
      arg = mine.arg;
      expect(arg).toEqual(12);
      done();
    });

    expect(arg).toEqual(0);
    
    api.register('customCore', provider);
  });
});
