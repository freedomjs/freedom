/*jslint indent:2,browser:true, node:true */
var PromiseCompat = require('es6-promise').Promise;

var oAuthRedirectId = 'freedom.oauth.redirect.handler';

function RemotePageAuth() {
  "use strict";
  this.listeners = {};
}

/**
 * Begins the oAuth process. Let the platform choose the redirect URI
 * @param initiateOAuth
 * @param {String[]} Valid oAuth redirect URIs for your application
 * @return {{redirect: String, state: String}} A chosen redirect URI and
 *    state which will be monitored for oAuth redirection if available
 **/
RemotePageAuth.prototype.initiateOAuth = function(redirectURIs, continuation) {
  "use strict";
  if (typeof global !== 'undefined' && global && global.document) {
    for (var i=0; i<redirectURIs.length; i++) {
      // TODO: remove restriction on URL pattern match.
      if ((redirectURIs[i].indexOf('http://') === 0 ||
          redirectURIs[i].indexOf('https://') === 0) &&
          redirectURIs[i].indexOf('oauth-relay.html') > 0) {
        continuation({
          redirect: redirectURIs[i],
          state: oAuthRedirectId + Math.random()
        });
        return true;
        //promises.push(monitorFrame(redirectURIs[i], instance));
      }
    }
  }
  return false;
};

/**
 * oAuth client-side flow - launch the provided URL
 *
 * @method initiateAuthFlow
 * @param {String} authUrl The URL that initiates the auth flow.
 * @param {Object.<string, string>} stateObj The return value from chooseRedirectUri
 * @return {String} responseUrl - containing the access token
 */
RemotePageAuth.prototype.launchAuthFlow = function(authUrl, stateObj, continuation) {
  "use strict";
  var frame = global.document.createElement('iframe');
  frame.src = stateObj.redirect;
  frame.style.display = 'none';

  global.document.body.appendChild(frame);
  frame.addEventListener('load', function () {
    window.open(authUrl);
    this.listeners[stateObj.state] = function (url) {
      continuation(url);
      //this.dispatchEvent("oAuthEvent", url);
    };//.bind(oAuth);

    frame.contentWindow.postMessage(stateObj.state, '*');
  }.bind(this));

  window.addEventListener('message', function (frame, msg) {
    if (msg.data && msg.data.key && msg.data.url && this.listeners[msg.data.key]) {
      this.listeners[msg.data.key](msg.data.url);
      try {
        document.body.removeChild(frame);
      } catch (e) {
        console.warn(e);
      }
    }
  }.bind(this, frame), false);

};

/**
 * If we have a local domain, and freedom.js is loaded at startup, we can use
 * the local page as a redirect URI.
 */
module.exports = function (oAuth) {
  'use strict';
  oAuth(RemotePageAuth);
};
