/**
 * @license tbd - something open.
 * see: https://github.com/UWNetworksLab/freedom
 */
(function(global) {
  var cfg = {global: global},
      context,
      setup;

  if (typeof global['freedom'] !== 'undefined') {
    return;
  }
