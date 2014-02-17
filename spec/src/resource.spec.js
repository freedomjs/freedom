describe("fdom.resources", function() {
  var resources;

  beforeEach(function() {  
    resources = new Resource();
    fdom.debug = new fdom.port.Debug();
  });

  it("should resolve URLs", function(done) {
    var promise = resources.get("http://localhost/folder/manifest.json",
                                 "file.js");
    var spy = jasmine.createSpy('resolver');
    promise.then(spy);
    setTimeout(function() {
      expect(spy).toHaveBeenCalledWith('http://localhost/folder/file.js');
      done();
    }, 0);
  });

  it("should cache resolved URLs", function(done) {
    spyOn(resources, 'resolve').and.callThrough();
    var deferred = resources.get("http://localhost/folder/manifest.json",
                                 "file.js");
    setTimeout(function() {
      deferred = resources.get("http://localhost/folder/manifest.json",
                               "file.js");
      expect(resources.resolve.calls.count()).toEqual(1);
      done();
    }, 0);
  });

  it("should fetch URLs", function(done) {
    var promise, response;
    promise = resources.getContents('manifest://{"name":"test"}');
    promise.then(function(data) {response = data;});
    setTimeout(function() {
      expect(response.name).toEqual("test");
      done();
    }, 0);
  });
  
  it("should warn on degenerate URLs", function(done) {
    var promise = resources.getContents();
    var spy = jasmine.createSpy('r');
    promise.then(function() {}, spy);
    setTimeout(function() {
      expect(spy).toHaveBeenCalled();

      promise = resources.resolve('test');
      promise.then(function() {}, spy);
    
      setTimeout(function() {
        expect(spy.calls.count()).toEqual(2);
        done();
      }, 0);
    }, 0);
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

    var promise = resources.get('test://manifest', 'myurl');
    var r1, r2;
    promise.then(function(url) {r1 = url;});

    promise = resources.get('otherprot://manifest', 'myurl');
    promise.then(function(url) {r2 = url;});

    setTimeout(function() {
      expect(r1).toEqual('resolved://myurl');
      expect(r2).toEqual(undefined);
      done();
    }, 0);
  });

  it("should handle custom retrievers", function(done) {
    var retriever = function(url, resolve) {
      expect(url).toContain("test://");
      resolve('Custom content!');
    };
    resources.addRetriever('test', retriever);

    var r1, r2;
    var promise = resources.getContents('test://url');
    promise.then(function(data) {r1 = data;});

    promise = resources.getContents('unknown://url');
    promise.then(function() {r2 = 'success';}, function() {r2 = 'failed';});

    setTimeout(function() {
      expect(r1).toEqual('Custom content!');
      expect(r2).toEqual('failed');
      done();
    }, 0);
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
  var r, f, spy, resources;

  beforeEach(function() {
    resources = new Resource();
    r = spy = jasmine.createSpy('resolvedURL');
    f = function() {};
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
    expect(spy).not.toHaveBeenCalled();
  });
});
