describe('fdom.port.AppInternal', function() {
  var app, manager, hub, global;
  beforeEach(function() {
    global = {freedom: {}};
    hub = new fdom.Hub();
    manager = new fdom.port.Manager(hub);
    app = new fdom.port.AppInternal(manager);
    hub.emit('config', {
      global: global
    });
    manager.setup(app);
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
});