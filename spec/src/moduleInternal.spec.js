var Api = require('../../src/api');
var Debug = require('../../src/debug');
var Hub = require('../../src/hub');
var Manager = require('../../src/manager');
var ModuleInternal = require('../../src/moduleinternal');

var testUtil = require('../util');

describe('ModuleInternal', function() {
  var app, manager, hub, global, loc;
  beforeEach(function() {
    global = {freedom: {}};
    hub = new Hub(new Debug());
    var resource = testUtil.setupResolvers();
    var api = new Api();
    api.set('core', {});
    api.register('core', function () {});
    manager = new Manager(hub, resource, api);
    app = new ModuleInternal(manager);
    hub.emit('config', {
      global: global,
      location: 'relative://'
    });
    manager.setup(app);

    var path = window.location.href,
        dir_idx = path.lastIndexOf('/');
    loc = path.substr(0, dir_idx) + '/';
});

  it('configures an app environment', function() {
    var source = testUtil.createTestPort('test');
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
    global.document = document;
    
    var script = btoa('fileIncluded = true; callback();');

    window.callback = function() {
      expect(fileIncluded).toEqual(true);
      delete callback;
      done();
    } 
    
    app.loadScripts(loc, ['data:text/javascript;base64,' + script, 'non_existing_file']);
  });

  it('load scripts sequentially', function(done) {
    global.document = document;

    fileIncluded = false;
    fileIncluded0 = false;

    var script0 = btoa('fileIncluded0 = true; callback0();');
    window.callback0 = function() {
      expect(fileIncluded0).toEqual(true);
      expect(fileIncluded).toEqual(false);
      delete callback0;
    };

    var script = btoa('fileIncluded = true; callback();');
    window.callback = function() {
      expect(fileIncluded0).toEqual(true);
      expect(fileIncluded).toEqual(true);
      delete callback;
      done();
    };

    app.loadScripts(loc, ['data:text/javascript;base64,' + script0,
                          'data:text/javascript;base64,' + script,
                          'non_existing_file']);
  })

  it('exposes dependency apis', function(done) {
    var source = testUtil.createTestPort('test');
    manager.setup(source);
    manager.createLink(source, 'default', app, 'default');
    source.on('onMessage', function(msg) {
      // Dependencies will be requested via 'createLink' messages. resolve those.
      if (msg.channel && msg.type === 'createLink') {
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
    hub.onMessage(source.messages[1][1].channel, {
      type: 'manifest',
      name: 'test',
      manifest: {name: 'test manifest'}
    });

    window.callback = function() {
      delete callback;
      expect(global.freedom.manifest.name).toEqual('My Module Name');
      expect(global.freedom.test.api).toEqual('social');
      expect(global.freedom.test.manifest.name).toEqual('test manifest');
      done();
    };
  });
});
