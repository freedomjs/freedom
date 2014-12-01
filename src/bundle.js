/*jslint indent:2,node:true */
var includeFolder = require('include-folder');
var minify = require('node-json-minify');

var util = require('./util');

var Bundle = function () {
  'use strict';
  var found;
  this.interfaces = [];
  /*jslint nomen: true */
  try {
    found = includeFolder(__dirname + '/../interface');
  } catch (e) {
    // pass.
  }
  /*jslint nomen: false */
  util.eachProp(found, function (json) {
    this.interfaces.push(JSON.parse(minify(json)));
  }.bind(this));
};

/**
 * Create a static instantiation of the bundle precompiled with found
 * interfaces. This returns a string of a valid implementation of this
 * file that can be used as a replacement for 
 */
exports.toStatic = function () {
  'use strict';
  var bundle = new Bundle();
  return "var Bundle = function() { this.interfaces =" +
    JSON.stringify(bundle.interfaces) + ";\n" +
    "};\n" +
    "exports.register = " + exports.register.toString() + ";";
};

/**
 * Populate an API registry with provided providers, and with known API
 * definitions.
 * @static
 * @method register
 * @param {{name: string, provider: Function, style?: string}[]} providers
 *   The core providers made available to this freedom.js instance.
 * @param {Api} registry The API registry to populate.
 */
exports.register = function (providers, registry) {
  'use strict';
  var bundle = new Bundle();
  bundle.interfaces.forEach(function (api) {
    if (api && api.name && api.api) {
      registry.set(api.name, api.api);
    }
  });

  providers.forEach(function (provider) {
    if (provider.name) {
      registry.register(provider.name, provider.provider, provider.style);
    }
  });
};
