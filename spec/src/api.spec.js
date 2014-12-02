var Api = require('../../src/api');

describe("Api", function() {
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
  
  it("should register core providers in promise style", function(done) {
    var provider = function(arg) { this.arg = arg };

    api.set('customCore', provider);
    api.register('customCore', provider, 'providePromises');
    var provideSpy = jasmine.createSpy('providePromises');
    var mockProvider = {
      getProxyInterface: function () {
        mockProviderInterface = {
          providePromises: provideSpy
        };
        return function() {return mockProviderInterface;};
      }
    };
    api.provideCore('customCore', mockProvider).then(function() {
      expect(provideSpy).toHaveBeenCalled();
      done();
    });
  });

  it("should provide core providers that can close themselves", function(done) {
    var provider = function(arg) { this.arg = arg };

    api.set('customCore', provider);
    api.register('customCore', provider, 'unprivilegedPromise');
    var provideSpy = jasmine.createSpy('providePromises');
    var mockProviderInterface;
    var mockProvider = {
      getProxyInterface: function () {
        mockProviderInterface = {
          providePromises: provideSpy
        };
        return function() {return mockProviderInterface;};
      }
    };
    api.provideCore('customCore', mockProvider).then(function() {
      expect(provideSpy).toHaveBeenCalled();
      var boundObject = provideSpy.calls.first().args[0];
      var obj = new boundObject();
      expect(obj.arg()).toEqual(mockProviderInterface);
      done();
    });
  });

  it("allows late registration of core providers", function(done) {
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
