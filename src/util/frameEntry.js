/*jslint node:true*/
// This alternative entry point can be used to build the contents of an iFrame,
// when using the frame link of freedom (specifically for unit testing since
// phantomJS doesn't support web workers.).

var providers = [
  require('../../providers/core/core.unprivileged')
];

require('../entry')({
  isModule: true,
  portType: require('../link/frame'),
  providers: providers,
  global: global
});
