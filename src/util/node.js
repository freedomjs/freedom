
/*jslint indent:2,white:true,sloppy:true,node:true */
/*
 * freedom.js Node runtime
 */

'use strict';

var sources = [
  '/..',
  '/../proxy',
  '/../../interface'
];

sources.forEach(function(dir) {
  require('fs').readdirSync(__dirname + dir).forEach(function(file) {
    if (file.match(/.+\.js/) !== null) {
      require(__dirname + dir + '/' + file);
    }
  });
});

module.exports.freedom = fdom.setup(global, undefined, {
  portType: 'nodeVM'
});
delete global.fdom;
