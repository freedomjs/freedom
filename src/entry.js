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
        'appContext': (!config || typeof(config.isApp) === "undefined") ? fdom.util.isAppContext() : config.isApp
      },
      manager = new fdom.port.Manager(hub),
      external = new fdom.port.Proxy(fdom.proxy.EventInterface),
      setupApp = function(app) {
        manager.setup(app);
        manager.createLink(external, 'default', app);
      },
      link;

  manager.setup(external);

  if (site_cfg.appContext) {
    if (config) {
      fdom.util.mixin(site_cfg, config, true);
    }
    site_cfg.global = global;
    site_cfg.src = freedom_src;
    setupApp(new fdom.link[site_cfg.portType]());

    // Delay debug messages until delegation to the parent context is setup.
    manager.once('delegate', manager.setup.bind(manager, fdom.debug));
  } else {
    manager.setup(fdom.debug);
    fdom.util.advertise(config ? config.advertise : undefined);
    
    // Configure against data-manifest.
    if (typeof document !== 'undefined') {
      fdom.util.eachReverse(fdom.util.scripts(global), function (script) {
        var manifest = script.getAttribute('data-manifest');
        var source = script.src;
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
    if(config) {
      fdom.util.mixin(site_cfg, config, true);
    }

    //Try to talk to local FreeDOM Manager
    if (!site_cfg['stayLocal']) {
      link = new fdom.port.Runtime();
      manager.setup(link);
    }

    if (typeof location !== 'undefined') {
      link = location.protocol + "//" + location.host + location.pathname;
    } else if (site_cfg.location) {
      link = site_cfg.location;
    }
    fdom.resources.get(link, site_cfg.manifest).then(function(url) {
      setupApp(new fdom.port.Module(url, []));
    });
  }
  hub.emit('config', site_cfg);

  // Enable console.log from worker contexts.
  if (typeof global.console === 'undefined') {
    global.console = fdom.debug;
  }
  
  return external.getInterface();
};
