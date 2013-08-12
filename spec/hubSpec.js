describe("fdom.Hub", function() {
  var hub;

  beforeEach(function() {
    hub = new fdom.Hub();
  });

  it("works as a singleton", function() {
    var first = fdom.Hub.get();
    var second = fdom.Hub.get();
    expect(first).toBe(second);
  });

  it("routes messages", function() {
    var registration = jasmine.createSpy('cb');
    var channel = jasmine.createSpyObj('chan', ['postMessage']);
    var app = {
      id: 'testApp',
      channels: {'default': channel},
      getChannel: function() {}
    }; 
    hub.on('register', registration);
    hub.register(app);

    expect(registration).toHaveBeenCalled();
    hub.onMessage(app, {
      sourceFlow: 'default'
    });
    expect(channel.postMessage).toHaveBeenCalled();
  });

  it("prints debug messages", function() {
    var channel = jasmine.createSpyObj('chan', ['postMessage']);
    var app = {
      id: 'testApp',
      channels: {'default': channel},
      getChannel: function() {}
    }; 
    hub.register(app);

    spyOn(console, 'log');
    hub.onMessage(app, {
      sourceFlow: 'control',
      request: 'debug',
      msg: 'testdbg'
    });
    expect(console.log).not.toHaveBeenCalled();

    hub.config.debug = true;
    hub.onMessage(app, {
      sourceFlow: 'control',
      request: 'debug',
      msg: 'testdbg'
    });
    expect(console.log).toHaveBeenCalled();
    expect(console.log.mostRecentCall.args[0]).toContain('testdbg');
  });

  it("sets up new apps", function() {
    var app = jasmine.createSpyObj('app', ['configure', 'onMessage']);
    app.getChannel = function() {return app};
    spyOn(fdom.app, 'External').andReturn(app);

    app.id = hub.ensureApp('myApp');
    expect(app.configure).toHaveBeenCalled();
    spyOn(console, 'warn');
    hub.onMessage(app, {
      sourceFlow: 'default'
    });
    expect(app.onMessage).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalled();

    app.manifest = {dependencies: {'self': app.id}};
    hub.createPipe(app, 'self');
    hub.onMessage(app, {
      sourceFlow: 'self'
    });
    expect(app.onMessage).toHaveBeenCalled();
  });
});

