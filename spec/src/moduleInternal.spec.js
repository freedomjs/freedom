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
      delete callback;
      done();
    }
    app.loadScripts(loc, 'relative://spec/helper/beacon.js');
  });

  it('exposes dependency apis', function(done) {
    var source = createTestPort('test');
    manager.setup(source);
    manager.createLink(source, 'default', app, 'default');
    source.on('onMessage', function(msg) {
      // Dependencies will be requested via 'createLink' messages. resolve those.
      if (msg.channel && msg.name !== 'default') {
        hub.onMessage(msg.channel, {
          type: 'channel announcement',
          channel: msg.reverse
        });
      } else if (msg.type === 'resolve') {
        hub.onMessage(source.messages[1][1].channel, {
          id: msg.id,
          data: 'spec/' + msg.data
        });
      }
    });

    global.document = document;

    hub.onMessage(source.messages[1][1].channel, {
      channel: source.messages[1][1].reverse,
      appId: 'testApp',
      lineage: ['global', 'testApp'],
      manifest: {
        name: 'My Module Name',
        app: {
          script: 'helper/beacon.js'
        },
        dependencies: {
          "test": {
            "url": "relative://spec/helper/friend.json",
            "api": "social"
          }
        }
      },
      id: 'relative://spec/helper/manifest.json',
    });

    callback = function() {
      expect(global.freedom.manifest.name).toEqual('My Module Name');
      expect(global.freedom.test.api).toEqual('social');
      delete callback;
      hub.onMessage(source.messages[1][1].channel, {
        type: 'manifest',
        name: 'test',
        manifest: {name: 'test manifest'}
      });
      expect(global.freedom.test.manifest.name).toEqual('test manifest');
      done();
    };
  });
});
