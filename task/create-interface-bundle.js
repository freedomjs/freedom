/*jslint node:true */

module.exports = function (grunt) {
  'use strict';
  var minify = require('node-json-minify'),
    fs = require('fs');

  grunt.registerMultiTask('create-interface-bundle',
    'Prepare freedom.js interface bundle.',
    function () {
      this.files.forEach(function (filePair) {
        var interfaces = [];
        filePair.src.forEach(function (file) {
          interfaces.push(fs.readFileSync(file, 'utf-8'));
        });
        interfaces = interfaces.map(function (iface) {
          return JSON.parse(minify(iface));
        });
        fs.writeFileSync(filePair.dest,
            'module.exports = ' + JSON.stringify(interfaces) + ';\n');
      });
    });
};
