var providers = [
  require('../../providers/core/core.unprivileged'),
  require('../../providers/core/echo.unprivileged'),
  require('../../providers/core/logger.console'),
  require('../../providers/core/peerconnection.unprivileged'),
  require('../../providers/core/storage.localstorage'),
  require('../../providers/core/view.unprivileged'),
  require('../../providers/core/websocket.unprivileged')
];

var oauth = require('../../providers/core/oauth');
require('../../providers/oauth/oauth.pageauth').register(oauth);
require('../../providers/oauth/oauth.remotepageauth').register(oauth);

providers.push(oauth);


if (typeof window !== 'undefined') {
  window.freedom = require('../entry').bind({}, {
    location: window.location.href,
    portType: require('../link/worker'),
    // Works in Chrome
    source: window.document.head.lastChild.src,
    providers: providers
  });
} else {
  require('../entry')({
    isModule: true,
    portType: require('../link/worker'),
    providers: providers,
    global: global
  });
}
