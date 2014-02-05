describe('fdom.port.ModuleInternal', function() {
  var app, manager, hub, global, loc;
  beforeEach(function() {
    global = {freedom: {}};
    hub = new fdom.Hub();
    manager = new fdom.port.Manager(hub);
    app = new fdom.port.ModuleInternal(manager);
    hub.emit('config', {
      global: global
    });
    manager.setup(app);

    var path = window.location.href,
        dir_idx = path.lastIndexOf('/');
    loc = path.substr(0, dir_idx) + '/';
});

  it('configures an app environment', function() {
    var source = createTestPort('test');
    manager.setup(source);
    manager.createLink(source, 'default', app, 'default');

    hub.onMessage(source.messages[1][1].channel, {
      channel: source.messages[1][1].reverse,
      appId: 'testApp',
      lineage: ['global', 'testApp'],
      manifest: {
        app: {
          script: 'helper/channel.js'
        },
        permissions: ['core.echo'],
        dependencies: ['helper/friend.json'],
        provides: ['identity']
      },
      id: 'relative://spec/helper/manifest.json',
    });

    expect(source.gotMessage('control', {'name': 'identity'})).toBeDefined();
    expect(source.gotMessage('control', {'name': 'core.echo'})).toBeDefined();
  });

  it('handles script loading and attachment', function(done) {
    setupResolvers();
    global.document = document;
  
    callback = function() {
      expect(fileIncluded).toEqual(true);
      done();
    }
    app.loadScripts(loc, 'relative://spec/helper/beacon.js');
  });
});