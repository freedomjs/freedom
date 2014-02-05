describe("fdom.Hub", function() {
  var hub;

  beforeEach(function() {
    hub = new fdom.Hub();
    fdom.debug = new fdom.port.Debug();
  });

  it("routes messages", function() {
    var app = {
      id: 'testApp'
    };
    hub.register(app);
    app.onMessage = jasmine.createSpy('cb');
    var route = hub.install(app, 'testApp', 'test');
    
    var msg = {test: true};
    hub.onMessage(route, msg);

    expect(app.onMessage).toHaveBeenCalledWith('test', msg);
  });

  it("requires registration", function() {
    var app = {
      id: 'testApp'
    };
    spyOn(fdom.debug, 'warn');
    hub.install(app, null, 'magic');
    expect(fdom.debug.warn).toHaveBeenCalled();

    hub.register(app);
    hub.install(app, null, 'magic');
    expect(fdom.debug.warn.calls.count()).toEqual(2);
    expect(hub.register(app)).toEqual(false);

    expect(hub.deregister(app)).toEqual(true);
    expect(hub.deregister(app)).toEqual(false);
  });

  it("goes between apps", function() {
    var app1 = {
      id: 'testApp'
    };
    var app2 = {
      id: 'otherApp'
    };
    hub.register(app1);
    hub.register(app2);
    app2.onMessage = jasmine.createSpy('cb');
    var route = hub.install(app1, 'otherApp', 'testx');
    
    var msg = {test: true};
    hub.onMessage(route, msg);

    expect(app2.onMessage).toHaveBeenCalledWith('testx', msg);
  });

  it("alerts if messages are sent improperly", function() {
    var app = {
      id: 'testApp'
    };
    hub.register(app);
    app.onMessage = jasmine.createSpy('cb');

    spyOn(fdom.debug, 'warn');
    
    hub.onMessage('test', "testing");

    expect(app.onMessage).not.toHaveBeenCalled();
    expect(fdom.debug.warn).toHaveBeenCalled();
  });

  it("removes routes", function() {
    spyOn(fdom.debug, 'warn');
    var app1 = {
      id: 'testApp'
    };
    var app2 = {
      id: 'otherApp'
    };
    hub.register(app1);
    hub.register(app2);
    app2.onMessage = jasmine.createSpy('cb');
    var route = hub.install(app1, 'otherApp', 'testx');
    
    var msg = {test: true};
    hub.onMessage(route, msg);

    expect(app2.onMessage).toHaveBeenCalledWith('testx', msg);

    hub.uninstall(app1, route);

    expect(fdom.debug.warn).not.toHaveBeenCalled();

    hub.onMessage(route, msg);
    expect(fdom.debug.warn).toHaveBeenCalled();
  });

  it("Handles failures when removing routes", function() {
    spyOn(fdom.debug, 'warn');
    var app1 = {
      id: 'testApp'
    };
    var app2 = {
      id: 'otherApp'
    };
    hub.register(app1);
    hub.register(app2);
    app2.onMessage = jasmine.createSpy('cb');
    var route = hub.install(app1, 'otherApp', 'testx');
    
    hub.uninstall(app2, route);
    expect(fdom.debug.warn).toHaveBeenCalled();

    hub.uninstall({id: null}, route);
    expect(fdom.debug.warn.calls.count()).toEqual(2);

    expect(hub.uninstall(app1, route+'fake')).toEqual(false);

    hub.deregister(app2);
    expect(hub.getDestination(route)).toEqual(undefined);
    expect(hub.getDestination(route+'fake')).toEqual(null);

    hub.onMessage(route, {test: true});
    expect(fdom.debug.warn.calls.count()).toEqual(3);
  });
});

