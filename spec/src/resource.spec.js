var Debug = require('../../src/debug');
var Resource = require('../../src/resource');

describe("Resource", function() {
  var resources, debug;

  beforeEach(function() {
    debug = new Debug();
    resources = new Resource(debug);
  });

  it("should resolve URLs", function(done) {
    var promise = resources.get("http://localhost/folder/manifest.json",
                                 "file.js");
    var callback = function(response) {
      expect(response).toEqual('http://localhost/folder/file.js');
      done();
    };
    promise.then(callback);
  });

  it("should cache resolved URLs", function(done) {
    spyOn(resources, 'resolve').and.callThrough();
    var promise = resources.get("http://localhost/folder/manifest.json",
                                 "file.js");
    var callback = function() {
      promise = resources.get("http://localhost/folder/manifest.json",
                              "file.js");
      promise.then(function() {
        expect(resources.resolve.calls.count()).toEqual(1);
        done();
      });
    };
    promise.then(callback);
  });

  it("should fetch URLs", function(done) {
    var promise;
    promise = resources.getContents('manifest://{"name":"test"}');
    promise.then(function(response) {
      expect(JSON.parse(response).name).toEqual("test");
      done();
    });
  });
  
  it("should warn on degenerate URLs", function(done) {
    var promise = resources.getContents();
    var spy = jasmine.createSpy('r');
    promise.then(function() {}, function() {
      resources.resolve('test').then(function(){}, function() {
        done();
      });
    });
  });

  it("should handle custom resolvers", function(done) {
    var resolver = function(manifest, url, resolve) {
      if (manifest.indexOf('test') === 0) {
        resolve('resolved://' + url);
        return true;
      } else {
        return false;
      }
    };
    resources.addResolver(resolver);

    resources.get('test://manifest', 'myurl').then(function(url) {
      expect(url).toEqual('resolved://myurl');
      resources.get('otherprot://manifest', 'myurl').then(function(url2) {
        expect(url2).toEqual(undefined);
      });
      setTimeout(done,0);
    });
  });

  it("should handle custom retrievers", function(done) {
    var retriever = function(url, resolve) {
      expect(url).toContain("test://");
      resolve('Custom content!');
    };
    resources.addRetriever('test', retriever);

    resources.getContents('test://url').then(function(data) {
      expect(data).toEqual('Custom content!');
      resources.getContents('unknown://url').then(function(){}, function(){
        done();
      });
    });
  });

  it("should not allow replacing retrievers", function() {
    var retriever = function(url, deferred) {
      expect(url).toContain("test://");
      deferred.resolve('Custom content!');
    };
    spyOn(debug, 'warn');
    resources.addRetriever('http', retriever);
    expect(debug.warn).toHaveBeenCalled();
  });
});

describe('resources.httpResolver', function() {
  var r, f, spy, resources;

  beforeEach(function() {
    resources = new Resource();
    r = spy = jasmine.createSpy('resolvedURL');
    f = jasmine.createSpy('rejectURL');
  });

  it("should resolve relative URLs", function() {
    resources.httpResolver('http://www.example.com/path/manifest.json', 'test.html', r, f);
    expect(spy).toHaveBeenCalledWith('http://www.example.com/path/test.html');
  });

  it("should resolve path absolute URLs", function() {
    resources.httpResolver('http://www.example.com/path/manifest.json', '/test.html', r, f);
    expect(spy).toHaveBeenCalledWith('http://www.example.com/test.html');
  });

  it("should resolve absolute URLs", function() {
    resources.httpResolver('http://www.example.com/path/manifest.json', 'http://www.other.com/test.html', r, f);
    expect(spy).toHaveBeenCalledWith('http://www.other.com/test.html');
  });

  it("should not resolve URLs without manifest", function() {
    resources.httpResolver(undefined, 'test.html', r, f);
    expect(f).toHaveBeenCalled();
  });

  it("should remove relative paths", function() {
    var result = Resource.removeRelativePath('http:////www.example.com/./../test1/test2/../test3/')
    expect(result).toEqual('http://www.example.com/test1/test3/');
  });

  it("should resolve paths with relative paths", function() {
    resources.httpResolver('http://www.example.com/path/manifest.json', '../../test.html', r, f);
    expect(spy).toHaveBeenCalledWith('http://www.example.com/test.html');
  });

  it("should remove buggy cca URLs", function() {
    resources.httpResolver('chrome-extension:////extensionid/manifest.json', 'resource.js', r, f);
    expect(spy).toHaveBeenCalledWith('chrome-extension://extensionid/resource.js');
  });
});
