describe("fdom.Hub", function() {
  var hub;
  fdom.debug = new fdom.port.Debug();


  beforeEach(function() {
    hub = new fdom.Hub();
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
});

