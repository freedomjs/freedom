/**
 * @license tbd - something open.
 * see: https://github.com/UWNetworksLab/freedom
 */
(function(global) {
  var freedom_src = arguments.callee.toString();
  "use strict";
  var context,
      setup;

  if (typeof global['freedom'] !== 'undefined') {
    return;
  }
