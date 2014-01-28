/*jslint indent:2,white:true,sloppy:true,node:true */
/*
 * freedom.js Node runtime
 */

'use strict';

var fdom = module.exports = {};

module.exports.freedom = fdom.setup(global, undefined, {
  portType: 'Node',
  isApp: false,
  stayLocal: true
});
delete global.fdom;
