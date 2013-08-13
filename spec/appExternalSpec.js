describe("fdom.app.External", function() {
  var hub;
  var app;

  beforeEach(function() {
    var hub = new fdom.Hub();
    var config = {
      manifest: "spec/helper/manifest.json"
    }
    app = new fdom.app.External(hub);
    app.configure(config);
  });

  it("provides channels", function() {
    spyOn(app, 'loadManifest').andReturn();
    var chan = app.getChannel();
    expect(chan).toEqual(jasmine.any(fdom.Channel));
  });

  it("provides proxies", function() {
    spyOn(app, 'loadManifest').andReturn();
    var proxy = app.getProxy();
    expect(proxy.on).toBeDefined();
    expect(proxy.emit).toBeDefined();
  });

  it("loads manifests", function() {
    var manifest = false;
    runs(function() {
      spyOn(app, 'start').andReturn();
      app.on('manifest', function() {
        manifest = true;
      });
      var chan = app.getChannel();
    });

    waitsFor(function() {
      return manifest;
    }, "Manifest should be loaded", 750);

    runs(function() {
      expect(app.start).toHaveBeenCalled();
      expect(app.manifest.name).toEqual("Echo");
    });
  });

  it("posts Messages", function() {
    var manifest = false;
    var worker = jasmine.createSpyObj('worker', ['postMessage']);
    runs(function() {
      spyOn(app, 'start').andCallFake(function() {
        app.worker = worker;
      });
      app.on('manifest', function() {
        manifest = true;
      });
      var chan = app.getChannel();
    });

    waitsFor(function() {
      return manifest;
    }, "Manifest should be loaded", 750);

    runs(function() {
      expect(app.start).toHaveBeenCalled();
      app.ready();
      app.postMessage("test Message");
      expect(worker.postMessage).toHaveBeenCalled();
    });
  });
});

