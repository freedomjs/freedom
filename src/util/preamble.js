/**
 * @license tbd - something open.
 * see: https://github.com/UWNetworksLab/freedom
 */
(function (global) {
  'use strict';
  (function freedom() {
    /* jshint -W069 */

    var freedom_src = '(function (global) {\'use strict\';(' + freedom + ')();})(this);';
    var fdom;

    if (typeof global['freedom'] !== 'undefined') {
      return;
    }

    /* jshint -W093 */
    /* jshint -W034 */
    if (typeof window === 'undefined') {
      var window = global;
    }