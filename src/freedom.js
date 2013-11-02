/**
 * @module freedom
 */

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
setup = function (global, freedom_src, config) {
  var hub = new fdom.Hub(),
      site_cfg = {
        'debug': true,
        'stayLocal': false,
        'portType': 'Worker'
      },
      manager = new fdom.port.Manager(hub),
      external = new fdom.port.Proxy(fdom.proxy.EventInterface),
      setupApp = function(app) {
        manager.setup(app);
        manager.createLink(external, 'default', app);
      },
      link;
  
  // Debugging is not recorded until this point.
  fdom.debug = new fdom.port.Debug();

  manager.setup(external);
  manager.setup(fdom.debug);
  
  if (isAppContext()) {
    site_cfg.global = global;
    site_cfg.src = freedom_src;
    setupApp(new fdom.port[site_cfg.portType]());
  } else {
    advertise();
    
    // Configure against data-manifest.
    if (typeof document !== 'undefined') {
      eachReverse(scripts(), function (script) {
        var manifest = script.getAttribute('data-manifest');
        var source = script.src;
        if (manifest) {
          site_cfg.source = source;
          site_cfg.manifest = manifest;
          if (script.textContent.trim().length) {
            try {
              mixin(site_cfg, JSON.parse(script.textContent), true);
            } catch (e) {
              fdom.debug.warn("Failed to parse configuration: " + e);
            }
          }
          return true;
        }
      });
    }
    //Try to talk to local FreeDOM Manager
    if (!site_cfg['stayLocal']) {
      link = new fdom.port.Runtime();
      manager.setup(link);
    }

    site_cfg.global = global;
    site_cfg.src = freedom_src;
    site_cfg.resources = fdom.resources;
    if(config) {
      mixin(site_cfg, config, true);
    }
    link = location.protocol + "//" + location.host + location.pathname;
    fdom.resources.get(link, site_cfg.manifest).done(function(url) {
      setupApp(new fdom.port.App(url, []));
    });
  }
  hub.emit('config', site_cfg);

  // Enable console.log from worker contexts.
  if (typeof global.console === 'undefined') {
    global.console = fdom.debug;
  }
  
  return external.getInterface();
};
