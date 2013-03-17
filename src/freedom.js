// This structure is meant to resemble that of require.js
/*jslint sloppy:true */
/*global window, document, setTimeout, XMLHttpRequest */

/**
 * Main entry point.
 */
setup = function () {
  var def;
  var site_cfg = {
    global: global,
    src: "(" + freedom_src + ")(this);"
  };

  if (isAppContext()) {
    def = new fdom.app.Internal();
  } else {
    def = new fdom.app.External();    

    // Configure against data-manifest.
    if (typeof document !== 'undefined') {
      eachReverse(scripts(), function (script) {
        var manifest = script.getAttribute('data-manifest');
        var source = script.src;
        if (manifest) {
          site_cfg.source = source;
          site_cfg.manifest = manifest;
          return true;
        }
      });
    }
  }
  def.configure(site_cfg);

  // Enable console.log from worker contexts.
  if (typeof global.console === 'undefined') {
    global.console = {
      log: def.debug.bind(def)
    };
  }

  return def.getProxy();
};

