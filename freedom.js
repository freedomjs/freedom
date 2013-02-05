/**
 * @license tbd - something open.
 * see: https://github.com/UWNetworksLab/freedom
 */
// This structure is meant to resemble that of require.js
/*jslint sloppy:true */
/*global window, document, setTimeout, XMLHttpRequest */

var freedom;
(function(global) {
  var cfg = {},
      context;

  if (typeof freedom !== 'undefined') {
    return;
  }

  /**
   * Helper function for iterating over an array backwards. If the func
   * returns a true value, it will break out of the loop.
   */
  function eachReverse(ary, func) {
    if (ary) {
      var i;
      for (i = ary.length - 1; i > -1; i -= 1) {
        if (ary[i] && func(ary[i], i, ary)) {
          break;
        }
      }
    }
  }

  /**
   * Cycles over properties in an object and calls a function for each
   * property value. If the function returns a truthy value, then the
   * iteration is stopped.
   */
  function eachProp(obj, func) {
    var prop;
    for (prop in obj) {
      if (obj.hasOwnProperty(prop)) {
        if (func(obj[prop], prop)) {
          break;
        }
      }
    }
  }

  /**
   * Simple function to mix in properties from source into target,
   * but only if target does not already have a property of the same name.
   * This is not robust in IE for transferring methods that match
   * Object.prototype names, but the uses of mixin here seem unlikely to
   * trigger a problem related to that.
   */
  function mixin(target, source, force, deepStringMixin) {
    if (source) {
      eachProp(source, function (value, prop) {
        if (force || !hasProp(target, prop)) {
          if (deepStringMixin && typeof value !== 'string') {
            if (!target[prop]) {
              target[prop] = {};
            }
            mixin(target[prop], value, force, deepStringMixin);
          } else {
            target[prop] = value;
          }
        }
      });
    }
    return target;
  }

  function scripts() {
      return document.getElementsByTagName('script');
  }

  function newContext() {
    var config = {
      manifest: 'manifest.json'
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
        loadManifest(config.manifest, this.onManifest.bind(this, callback), function(error) {
          console.warn(error);
        });
      },
      
      onManifest: function(callback, manifest) {
        console.log(manifest);
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
  freedom = function (config, channel, callback) {
    if (!context) {
      context = newContext();
    }
    
    if (config) {
      context.configure(config);
    }

    return context.create(channel, callback);
  };

  //TODO(willscott): These should come from the context.
  freedom.addEventListener = function() {};
  freedom.click = function() {};

  // Look for data-manifest.
  eachReverse(scripts(), function (script) {
    var manifest = script.getAttribute('data-manifest');
    if (manifest) {
      cfg.manifest = manifest;
      return true;
    }
  });

  // Create default context.
  freedom(cfg);
})(this);
