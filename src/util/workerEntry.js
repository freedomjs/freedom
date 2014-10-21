/*jslint node:true*/

var providers = [
  require('../../providers/core/core.unprivileged'),
  require('../../providers/core/echo.unprivileged'),
  require('../../providers/core/console.unprivileged'),
  require('../../providers/core/peerconnection.unprivileged'),
  require('../../providers/core/core.rtcpeerconnection'),
  require('../../providers/core/core.rtcdatachannel'),
  require('../../providers/core/storage.localstorage'),
  require('../../providers/core/view.unprivileged'),
  require('../../providers/core/websocket.unprivileged')
];

var oauth = require('../../providers/core/oauth');
require('../../providers/oauth/oauth.pageauth').register(oauth);
require('../../providers/oauth/oauth.remotepageauth').register(oauth);

providers.push(oauth);


if (typeof window !== 'undefined') {
  var scripts = window.document.getElementsByTagName('script');
  window.freedom = require('../entry').bind({}, {
    location: window.location.href,
    portType: require('../link/worker'),
    // Works in Chrome
    source: scripts[scripts.length - 1].src,
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
