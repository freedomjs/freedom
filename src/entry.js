/*globals Promise */
/*jslint indent:2,node:true */
var Api = require('apis');
var Debug = require('debug');
var Hub = require('hub');
var Manager = require('manager');
var Policy = require('policy');
var Resource = require('resource');
var util = require('util');

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
    hub = new Hub(),
    resource = new Resource(),
    api = new Api(),
    manager = new Manager(hub, resource, api),
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

  if (site_cfg.moduleContext) {
    Port = require(site_cfg.portType);
    link = new Port();
    manager.setup(link);

    // Delay debug messages until delegation to the parent context is setup.
    manager.once('delegate', manager.setup.bind(manager, debug));
  } else {
    manager.setup(debug);
    
    policy = new Policy(manager, resource, site_cfg);

    resource.get(site_cfg.location, site_cfg.manifest).then(function (root_mod) {
      policy.get([], root_mod)
          .then(manager.createLink.bind(manager, external, 'default'));
    }, function (err) {
      debug.error('Failed to retrieve manifest: ' + err);
    });
  }
  hub.emit('config', site_cfg);

  return new Promise(function (resolve, reject) {
  });
};

module.exports = setup;
