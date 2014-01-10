describe("fdom.resources", function() {
  var resources;

  beforeEach(function() {  
    resources = new Resource();
    fdom.debug = new fdom.port.Debug();
  });

  it("should resolve URLs", function() {
    var deferred = resources.get("http://localhost/folder/manifest.json",
                                 "file.js");
    var spy = jasmine.createSpy('resolver');
    deferred.done(spy);
    expect(spy).toHaveBeenCalledWith('http://localhost/folder/file.js');
  });

  it("should cache resolved URLs", function() {
    spyOn(resources, 'resolve').andCallThrough();
    var deferred = resources.get("http://localhost/folder/manifest.json",
                                 "file.js");
    deferred = resources.get("http://localhost/folder/manifest.json",
                                 "file.js");
    expect(resources.resolve.calls.length).toEqual(1);
  });

  it("should fetch URLs", function() {
    var deferred, response;
    deferred = resources.getContents('manifest://{"name":"test"}');
    deferred.done(function(data) {response = data;});
    expect(response.name).toEqual("test");
  });
  
  it("should warn on degenerate URLs", function() {
    var deferred = resources.getContents();
    var spy = jasmine.createSpy('r');
    deferred.fail(spy);
    expect(spy).toHaveBeenCalled();

    deferred = resources.resolve('test');
    deferred.fail(spy);
    expect(spy.callCount).toEqual(2);
  });

  it("should handle custom resolvers", function() {
    var resolver = function(manifest, url, deferred) {
      if (manifest.indexOf('test') === 0) {
        deferred.resolve('resolved://' + url);
        return true;
      } else {
        return false;
      }
    };
    resources.addResolver(resolver);

    var deferred = resources.get('test://manifest', 'myurl');
    var result;
    deferred.done(function(url) {result = url;});
    expect(result).toEqual('resolved://myurl');
    
    deferred = resources.get('otherprot://manifest', 'myurl');
    deferred.done(function(f) {result = f;});
    expect(result).toEqual(undefined);
  });

  it("should handle custom retrievers", function() {
    var retriever = function(url, deferred) {
      expect(url).toContain("test://");
      deferred.resolve('Custom content!');
    };
    resources.addRetriever('test', retriever);

    var deferred = resources.getContents('test://url');
    var result;
    deferred.done(function(data) {result = data;});
    expect(result).toEqual('Custom content!');

    deferred = resources.getContents('unknown://url');
    deferred.fail(function() {result = 'failed';});
    expect(result).toEqual('failed');
  });

  it("should not allow replacing retrievers", function() {
    var retriever = function(url, deferred) {
      expect(url).toContain("test://");
      deferred.resolve('Custom content!');
    };
    spyOn(fdom.debug, 'warn');
    resources.addRetriever('http', retriever);
    expect(fdom.debug.warn).toHaveBeenCalled();
  });
});

describe('fdom.resources.httpResolver', function() {
  var deferred, spy, resources;

  beforeEach(function() {
    resources = new Resource();
    deferred = fdom.proxy.Deferred();
    spy = jasmine.createSpy('resolvedURL');
    deferred.done(spy);
  });

  it("should resolve relative URLs", function() {
    resources.httpResolver('http://www.example.com/path/manifest.json', 'test.html', deferred);
    expect(spy).toHaveBeenCalledWith('http://www.example.com/path/test.html');
  });

  it("should resolve path absolute URLs", function() {
    resources.httpResolver('http://www.example.com/path/manifest.json', '/test.html', deferred);
    expect(spy).toHaveBeenCalledWith('http://www.example.com/test.html');
  });

  it("should resolve absolute URLs", function() {
    resources.httpResolver('http://www.example.com/path/manifest.json', 'http://www.other.com/test.html', deferred);
    expect(spy).toHaveBeenCalledWith('http://www.other.com/test.html');
  });
});
