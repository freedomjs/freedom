// This structure is meant to resemble that of require.js
/*jslint sloppy:true */
/*global window, document, setTimeout, XMLHttpRequest */

function newContext() {
  var config = {
    manifest: 'manifest.json',
    source: 'freedom.js'
  },
  channel;

  /**
   * Load the description of a freedom object.
   * TODO(willscott): Does this live here, or in the sandbox?
   */
  function loadManifest(manifest, callback, errback) {
    var ref = new XMLHttpRequest();
    ref.addEventListener('readystatechange', function(e) {
      if (ref.readyState == 4 && ref.responseText) {
        var resp = {};
        try {
          resp = JSON.parse(ref.responseText);
        } catch(e) {
          return errback(e);
        }
        callback(resp);
      } else if (ref.readyState == 4) {
        errback(ref.status);
      }
    }, false);
    ref.open("GET", manifest, true);
    ref.send();
  }

  context = {
    config: config,
    channel: null,
    proxy: null,
    
    /**
     * Set the context configuration.
     * @param {Object} cfg config object
     */
    configure: function(cfg) {
      mixin(config, cfg, true);
    },

    /**
     * @param {Object} channel An existing freedom channel to attach to.
     * @param {Function} callback function to call with the freedom object.
     */
    create: function(channel, callback) {
      this.channel = channel || new fdom.Channel(this);
      this.proxy = new fdom.Proxy(this.channel);

      if (!this.channel.isAppContext()) {
        loadManifest(config.manifest, this.onManifest.bind(this, callback), function(error) {
          console.warn(error);
        });
      } else {
        this.channel.start();
        setTimeout(callback, 0);
      }

      return this.proxy;
    },
    
    onManifest: function(callback, manifest) {
      if (manifest && manifest['app'] && manifest['app']['script']) {
        this.channel.start(manifest['app']['script']);
      } else {
        console.warn(manifest['name'] + " does not specify a valid application.");
      }
      if (callback) {
        callback();
      }
    }
  };

  return context;
}

/**
 * Main entry point.
 */
setup = function (config, channel, callback) {
  if (!context) {
    context = newContext();
  }
  
  if (config) {
    context.configure(config);
  }

  var proxy = context.create(channel, callback);
  proxy.addEventListener = function() {};
  return proxy;
};

// Look for data-manifest.
if (typeof document !== 'undefined') {
  eachReverse(scripts(), function (script) {
    var manifest = script.getAttribute('data-manifest');
    var source = script.src;
    if (manifest) {
      cfg.source = source;
      cfg.manifest = makeAbsolute(manifest);
      return true;
    }
  });
}
