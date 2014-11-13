/*jslint node:true*/

var providers = [
  require('../../providers/core/core.unprivileged'),
  require('../../providers/core/echo.unprivileged'),
  require('../../providers/core/console.unprivileged'),
  require('../../providers/core/peerconnection.unprivileged'),
  require('../../providers/core/core.rtcpeerconnection'),
  require('../../providers/core/core.rtcdatachannel'),
  require('../../providers/core/storage.localstorage'),
  require('../../providers/core/core.view'),
  require('../../providers/core/core.oauth'),
  require('../../providers/core/websocket.unprivileged')
];

function getFreedomScript() {
  'use strict';
  var script;
  if (window.document.currentScript) {
    // New browser API
    script = window.document.currentScript.src;
  } else if (document.readyState !== "complete" &&
             document.readyState !== "loaded") {
    // Included in HTML or through document.write
    script = window.document.getElementsByTagName('script');
    script = script[script.length - 1].src;
  } else {
    // Loaded through dom manipulation or async.
    script = document.querySelector(
      "script[src*='freedom.js'],script[src*='freedom-']"
    );
    if (script.length !== 1) {
      console.error("Could not determine freedom.js script tag.");
    }
    script = script[0].src;
  }
  return script;
}

if (typeof window !== 'undefined') {
  window.freedom = require('../entry').bind({}, {
    location: window.location.href,
    portType: require('../link/worker'),
    source: getFreedomScript(),
    providers: providers,
    oauth: [
      require('../../providers/oauth/oauth.localpageauth'),
      require('../../providers/oauth/oauth.remotepageauth')
    ]
  });
} else {
  require('../entry')({
    isModule: true,
    portType: require('../link/worker'),
    providers: providers,
    global: global
  });
}
