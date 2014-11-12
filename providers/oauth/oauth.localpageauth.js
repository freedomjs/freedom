/*jslint indent:2,browser:true, node:true */
var PromiseCompat = require('es6-promise').Promise;

var oAuthRedirectId = 'freedom.oauth.redirect.handler';

/**
 * If there is redirection back to the page, and oAuthRedirectID is set,
 * then report the auth and close the window.
 */
if (typeof window !== 'undefined' && window && window.location &&
    window.localStorage &&
    window.location.href.indexOf(oAuthRedirectId) > 0) {
  // This will trigger a 'storage' event on the window. See storageListener
  window.localStorage.setItem(oAuthRedirectId, new Date());
  window.close();
}

var LocalPageAuth = function() {
  "use strict";
  this.listeners = {};
};

/**
 * Begins the oAuth process. Let the platform choose the redirect URI
 * @param initiateOAuth
 * @param {String[]} Valid oAuth redirect URIs for your application
 * @return {{redirect: String, state: String}} A chosen redirect URI and
 *    state which will be monitored for oAuth redirection if available
 **/
LocalPageAuth.prototype.initiateOAuth = function(redirectURIs) {
  "use strict";
  if (typeof window !== 'undefined' && window && window.addEventListener) {
    var here = window.location.protocol + "//" + window.location.host +
        window.location.pathname;
    if (redirectURIs.indexOf(here) > -1) {
      return PromiseCompat.resolve({
        redirect: here,
        state: oAuthRedirectId + Math.random()
      });
    }
  } 
 
  return false;
};

/**
 * oAuth client-side flow - launch the provided URL
 *
 * @method initiateAuthFlow
 * @param {String} authUrl The URL that initiates the auth flow.
 * @param {Object.<string, string>} stateObj The return value from initiateOAuth
 * @return {String} responseUrl containing the access token
 */
LocalPageAuth.prototype.launchAuthFlow = function(authUrl, stateObj) {
  "use strict";
  var promise = new PromiseCompat(function (resolve, reject) {
    window.addEventListener('load', function () {
      // Add the storage listener
      var listener = this.storageListener.bind(this, resolve, reject, stateObj);
      this.listeners[stateObj.state] = listener;
      window.addEventListener("storage", listener, false);
      // Start 'er up
      window.open(authUrl);
    }.bind(this), true);
  }.bind(this));
 
  return promise;
};

/**
 * Handler for storage events, which relays them to waiting clients.
 * For the schema of the storage msg, see:
 * http://tutorials.jenkov.com/html5/local-storage.html#storage-events
 * @param {Function} resolve function to call to resolve promise
 * @param {Function} reject function to call to reject promise
 * @param {Object.<string, string>} stateObj the return value from initiateOAuth
 * @param {Object} msg storage event
 */
LocalPageAuth.prototype.storageListener = function(resolve, reject, stateObj, msg) {
  'use strict';
  if (msg.url.indexOf(stateObj.state) > -1) {
    //client.dispatchEvent("oAuthEvent", msg.url);
    window.removeEventListener("storage", this.listeners[stateObj.state], false);
    delete this.listeners[stateObj.state];
    resolve(msg.url);
  }
};

/**
 * If we have a local domain, and freedom.js is loaded at startup, we can use
 * the local page as a redirect URI.
 */
exports.register = function (OAuth) {
  'use strict';
  OAuth.register(new LocalPageAuth());
};
