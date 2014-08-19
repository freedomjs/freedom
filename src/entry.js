/*jslint indent:2,node:true */
var Promise = require('es6-promise').Promise;

var Api = require('./api');
var Debug = require('./debug');
var Hub = require('./hub');
var Manager = require('./manager');
var Policy = require('./policy');
var ProxyBinder = require('./proxybinder');
var Resource = require('./resource');
var util = require('./util');

var freedomGlobal;
var getGlobal = function () {
  'use strict';
  
  // Node.js
  if (typeof global !== 'undefined' && global.prototype === undefined) {
    freedomGlobal = global;
  // Browsers
  } else {
    setTimeout(function () {
      freedomGlobal = this;
    }, 0);
  }
};
getGlobal();

/**
 * Create a new freedom context.
 */
var setup = function (manifest, config) {
  'use strict';
  var debug = new Debug(),
    hub = new Hub(debug),
    resource = new Resource(debug),
    api = new Api(debug),
    manager = new Manager(hub, resource, api),
    binder = new ProxyBinder(manager),
    policy,
    site_cfg = {
      'debug': 'log',
      'manifest': manifest,
      'moduleContext': (!config || typeof (config.isModule) === "undefined") ?
          util.isModuleContext() :
          config.isModule
    },
    link,
    Port;

  if (config) {
    util.mixin(site_cfg, config, true);
  }
  site_cfg.global = freedomGlobal;

  return new Promise(function (resolve, reject) {
    if (site_cfg.moduleContext) {
      Port = require(site_cfg.portType);
      link = new Port();
      manager.setup(link);

      // Delay debug messages until delegation to the parent context is setup.
      manager.once('delegate', manager.setup.bind(manager, debug));
    } else {
      manager.setup(debug);
      api.getCore('core.logger', debug).then(function (Logger) {
        debug.setLogger(new Logger());
      });
    
      policy = new Policy(manager, resource, site_cfg);

      resource.get(site_cfg.location, site_cfg.manifest).then(function (root_manifest) {
        return policy.get([], root_manifest);
      }).then(function (root_module) {
        return binder.bindDefault(root_module, api, root_module.manifest);
      }).fail(function (err) {
        debug.error('Failed to retrieve manifest: ' + err);
      }).then(resolve, reject);
    }

    hub.emit('config', site_cfg);
  });
};

module.exports = setup;
