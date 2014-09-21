var providers = [
  require('../../providers/core/core.unprivileged')
];

require('../entry')({
  isModule: true,
  portType: require('../link/frame'),
  providers: providers,
  global: global
});
