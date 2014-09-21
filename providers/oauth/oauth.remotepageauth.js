/*jslint indent:2,browser:true, node:true */
var PromiseCompat = require('es6-promise').Promise;

var oAuthRedirectId = 'freedom.oauth.redirect.handler',
  listeners = {};


/**
 * Listen for messages from a relay iframe.
 */
function monitorFrame(src, oAuth) {
  'use strict';
  return new PromiseCompat(function (resolve, reject) {
    var frame = global.document.createElement('iframe'),
      state = oAuthRedirectId + Math.random();
    frame.src = src;
    frame.style.display = 'none';

    global.document.body.appendChild(frame);
    frame.addEventListener('load', function () {
      resolve({
        redirect: src,
        state: state
      });
      listeners[state] = function (url) {
        this.dispatchEvent("oAuthEvent", url);
      }.bind(oAuth);

      frame.contentWindow.postMessage(state, '*');
    });

    window.addEventListener('message', function (frame, msg) {
      if (msg.data && msg.data.key && msg.data.url && listeners[msg.data.key]) {
        listeners[msg.data.key](msg.data.url);
        document.body.removeChild(frame);
      }
    }.bind({}, frame), false);
  });
}

/**
 * If we have a local domain, and freedom.js is loaded at startup, we can use
 * the local page as a redirect URI.
 */
exports.register = function (OAuth) {
  'use strict';
  if (typeof global !== 'undefined' && global && global.document) {
    OAuth.register(function (redirectURIs, instance) {
      var promises = [], i;
      for (i = 0; i < redirectURIs.length; i += 1) {
        // TODO: remove restriction on URL pattern match.
        if ((redirectURIs[i].indexOf('http://') === 0 ||
             redirectURIs[i].indexOf('https://') === 0) &&
            redirectURIs[i].indexOf('oauth-relay.html') > 0) {
          promises.push(monitorFrame(redirectURIs[i], instance));
        }
      }
      if (promises.length) {
        return PromiseCompat.race(promises);
      } else {
        return false;
      }
    });
  }
};
