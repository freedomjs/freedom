/*jslint indent:2,browser:true, node:true */
var PromiseCompat = require('es6-promise').Promise;

var oAuthRedirectId = 'freedom.oauth.redirect.handler',
  listeners = {};

/**
 * Handler for storage events, which relays them to waiting clients.
 * @param {String} state State provided by the  
 */
function storageListener(state, client, msg) {
  'use strict';
  if (msg.url.indexOf(state) > -1) {
    client.dispatchEvent("oAuthEvent", msg.url);
    window.removeEventListener("storage", listeners[state], false);
    delete listeners[state];
  }
}

/**
 * If there is redirection back to the page, and oAuthRedirectID is set,
 * then report the auth and close the window.
 */
if (typeof window !== 'undefined' && window && window.location &&
    window.localStorage &&
    window.location.href.indexOf(oAuthRedirectId) > 0) {
  window.localStorage.setItem(oAuthRedirectId, new Date());
  window.close();
}

/**
 * If we have a local domain, and freedom.js is loaded at startup, we can use
 * the local page as a redirect URI.
 */
exports.register = function (OAuth) {
  'use strict';
  if (typeof window !== 'undefined' && window && window.addEventListener) {
    var here = window.location.protocol + "//" + window.location.host +
        window.location.pathname;

    window.addEventListener('load', function () {
      OAuth.register(function (uris, provider) {
        if (uris.indexOf(here) > -1) {
          var id = oAuthRedirectId + Math.random(),
            listener = storageListener.bind({}, id, provider);
          listeners[id] = listener;
          window.addEventListener("storage", listener, false);
          return PromiseCompat.resolve(id);
        }
        return false;
      });
    }, true);
  }
};
