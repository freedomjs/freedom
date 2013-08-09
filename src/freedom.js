// This structure is meant to resemble that of require.js

/**
 * Main entry point.
 */
setup = function () {
  var def;
  var site_cfg = {
    'debug': true,
    'strongIsolation': true
  };

  if (isAppContext()) {
    def = new fdom.app.Internal();
  } else {
    advertise();
    def = new fdom.app.External();    

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
              mixin(site_cfg, JSON.parse(script.innerText), true);
            } catch (e) {
              global.console.warn("Failed to parse configuration: " + e);
            }
          }
          return true;
        }
      });
    }
  }
  site_cfg.global = global;
  site_cfg.src = freedom_src;
  def.configure(site_cfg);

  // Enable console.log from worker contexts.
  if (typeof global.console === 'undefined') {
    global.console = {
      log: def.debug.bind(def)
    };
  }

  return def.getProxy();
};

