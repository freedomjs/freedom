/**
 * @license tbd - something open.
 * see: https://github.com/UWNetworksLab/freedom
 */
(function (global) {
  'use strict';
  (function freedom() {
    /* jshint -W069 */

    var freedom_src = '(function (global) {\'use strict\';(' + freedom + ')();})(this);';
    var setup, fdom;

    if (typeof global['freedom'] !== 'undefined') {
      return;
    }
