/*globals fdom:true, Promise, document, location, console */
/*jslint indent:2,sloppy:true */

/**
 * @module freedom
 */
if (typeof fdom === 'undefined') {
  fdom = {};
}

/**
 * External freedom Setup.  global.freedom is set to the value returned by
 * setup (see preamble.js and postamble.js for that mechanism).  As a result,
 * this is the primary entry function for the freedom library.
 * @for util
 * @method setup
 * @param {Object} global The window / frame / worker context freedom is in.
 * @param {String} freedom_src The textual code of freedom, for replication.
 * @param {Object} config Overriding config for freedom.js
 * @static
 */
fdom.setup = function (global, freedom_src, config) {
  fdom.debug = new fdom.port.Debug();

  var hub = new fdom.Hub(),
    site_cfg = {
      'debug': true,
      'stayLocal': false,
      'portType': 'Worker',
      'moduleContext': (!config || typeof (config.isModule) === "undefined") ?
          fdom.util.isModuleContext() :
          config.isModule
    },
    manager = new fdom.port.Manager(hub),
    external = new fdom.port.Proxy(fdom.proxy.EventInterface),
    link;

  manager.setup(external);

  if (site_cfg.moduleContext) {
    if (config) {
      fdom.util.mixin(site_cfg, config, true);
    }
    site_cfg.global = global;
    site_cfg.src = freedom_src;
    link = new fdom.link[site_cfg.portType]();
    manager.setup(link);
    manager.createLink(external, 'default', link);

    // Delay debug messages until delegation to the parent context is setup.
    manager.once('delegate', manager.setup.bind(manager, fdom.debug));
  } else {
    manager.setup(fdom.debug);
    fdom.util.advertise(config ? config.advertise : undefined);
    
    // Configure against data-manifest.
    if (typeof document !== 'undefined') {
      fdom.util.eachReverse(fdom.util.scripts(global), function (script) {
        var manifest = script.getAttribute('data-manifest'),
          source = script.src;
        if (manifest) {
          site_cfg.source = source;
          site_cfg.manifest = manifest;
          if (script.textContent.trim().length) {
            try {
              fdom.util.mixin(site_cfg, JSON.parse(script.textContent), true);
            } catch (e) {
              fdom.debug.warn("Failed to parse configuration: " + e);
            }
          }
          return true;
        }
      });
    }

    site_cfg.global = global;
    site_cfg.src = freedom_src;
    site_cfg.resources = fdom.resources;
    if (config) {
      fdom.util.mixin(site_cfg, config, true);
    }

    if (typeof location !== 'undefined') {
      site_cfg.location = location.protocol + "//" + location.host + location.pathname;
    }
    site_cfg.policy = new fdom.Policy(manager, site_cfg);

    fdom.resources.get(site_cfg.location, site_cfg.manifest).then(function (root_mod) {
      site_cfg.policy.get([], root_mod)
          .then(manager.createLink.bind(manager, external, 'default'));
    }, function (err) {
      fdom.debug.error('Failed to retrieve manifest: ' + err);
    });
  }
  hub.emit('config', site_cfg);

  // Enable console.log from worker contexts.
  if (typeof global.console === 'undefined') {
    global.console = fdom.debug;
  }
  
  return external.getInterface();
};
