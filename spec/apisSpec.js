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
    var client = jasmine.createSpyObj('channel', ['emit', 'on']);

    api.register('customCore', provider);
    var channel = api.getCore('customCore', client);
    channel.postMessage('custom message');

    expect(client.emit).toHaveBeenCalled();

    // Trying to provide a core service without a definition.
    expect(channel.instance).toEqual(null);
  });

  it("should register core providers", function() {
    var provider = function() {};
    var client = jasmine.createSpyObj('channel', ['emit', 'on']);

    api.set('customCore', provider);
    api.register('customCore', provider);
    var channel = api.getCore('customCore', client);
    channel.postMessage('custom message');

    expect(client.emit).toHaveBeenCalled();

    expect(channel.instance).not.toEqual(null);
    expect(channel.name).toEqual('customCore');
    expect(channel.channel).toEqual(client);
  });

});
