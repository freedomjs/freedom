describe("freedom", function() {
  var freedom, global, iac;
  beforeEach(function() {
    global = {
      addEventListener: function(msg, handler) {
        this['on'+msg] = handler;
      },
      postMessage: function(msg, to) {
        this.lastmsg = msg;
      }
    };
  
    // Setup resource loading for the test environment, which uses file:// urls.
    fdom.resources = new Resource();
    fdom.resources.addResolver(function(manifest, url, deferred) {
      if (url.indexOf('relative://') === 0) {
        var dirname = manifest.substr(0, manifest.lastIndexOf('/'));
        deferred.resolve(dirname + '/' + url.substr(11));
        return true;
      }
      return false;
    });
    fdom.resources.addResolver(function(manifest, url, deferred) {
      if (manifest.indexOf('file://') === 0) {
        manifest = 'http' + manifest.substr(4);
        fdom.resources.resolve(manifest, url).done(function(addr) {
          addr = 'file' + addr.substr(4);
          deferred.resolve(addr);
        });
        return true;
      }
      return false;
    });
    fdom.resources.addRetriever('file', fdom.resources.xhrRetriever);

    iac = isAppContext;
    isAppContext = function() {
      return true;
    };

    var path = window.location.href,
        dir_idx = path.lastIndexOf('/'),
        dir = path.substr(0, dir_idx) + '/';
    freedom = setup(global, undefined, undefined);
  });

  afterEach(function() {
    isAppContext = iac;
  });
  
  it("Loads an App", function() {
    var cb = jasmine.createSpy('cb');
    freedom.emit('fromApp', 'data');
    expect(global.lastmsg).toBeDefined();
  });
});
