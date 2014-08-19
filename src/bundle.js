/*jslint indent:2,node:true */
var includeFolder = require('include-folder');
var minify = require('node-json-minify');

var util = require('./util');

var Bundle = function () {
  'use strict';
  this.interfaces = [];
  var interfaces = includeFolder(__dirname + '/../interface');
  util.eachProp(interfaces, function (json) {
    this.interfaces.push(JSON.parse(minify(json)));
  }.bind(this));
};


exports.register = function (registry) {
  'use strict';
  var bundle = new Bundle();
  bundle.interfaces.forEach(function (api) {
    if (api && api.name && api.api) {
      registry.set(api.name, api.api);
    }
  });
};