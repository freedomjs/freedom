describe("fdom.apis", function() {
  var api;

  beforeEach(function() {
    api = new Api();
  });

  it("should return registered providers", function() {
    var provider = {id: "test"};
    api.set('customName', provider);
    expect(api.get('customName').definition).toEqual(provider);
    expect(api.get('customName').name).toEqual('customName');
    expect(api.get('otherName')).toBeFalsy();
  });

  it("should not allow core providers without an API.", function() {
    var provider = function() {};

    api.register('customCore', provider);
    var channel = api.getCore('customCore', null);
    expect(channel).toEqual(null);
  });

  it("should register core providers", function() {
    var provider = function(arg) { this.arg = arg };

    api.set('customCore', provider);
    api.register('customCore', provider);
    var channel = api.getCore('customCore', 12);
    var obj = new channel();

    expect(obj.arg).toEqual(12);
  });
});
