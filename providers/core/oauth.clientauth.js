/*globals fdom:true, console */
/*jslint indent:2,white:true,sloppy:true */

/**
 * An oauth provider to provide an oauth flow using a standard
 * client flow - in that the redirect URI is set to be the same
 * page, which will then message back & close itself.
 */
var OAuth_client = function(mod, dispatchEvent) {
  fdom.debug.log('OAuth Created!');
  this.mod = mod;

  this.listener = this.storageListener.bind(this);
  window.addEventListener("storage", this.listener, false);

  this.dispatchEvent = dispatchEvent;
};

var oAuthRedirectId = 'freedom.oauth.redirect.handler';

OAuth_client.redirectURIs = [];

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

if (typeof window !== 'undefined' && window && window.addEventListener) {
  window.addEventListener('load', function() {
    var here = window.location.protocol + "//" + window.location.host +
      window.location.pathname + '#' + oAuthRedirectId;
    OAuth_client.redirectURIs.push(here);
  }, false);
}

/**
 * Wait for storage message associated with the completion of an oAuth
 * session. This handler is named so that it can be appropraitely cleaned up.
 * @method storageListener
 * @private
 * @param {Function} continuation Function to call on event.
 * @param {StorageEvent} msg The storage event.
 */
OAuth_client.prototype.storageListener = function(msg) {
  if (msg.key === oAuthRedirectId) {
    this.dispatchEvent('oAuthEvent', msg.url);
  }
};

/**
 * Send a message to the bound custom channel.
 * @param {String} str The string to send.
 * @param {Function} continuation Function to call when sending is complete.
 * @method send
 */
OAuth_client.prototype.getRedirectURI = function(continuation) {
  continuation(OAuth_client.redirectURIs);
};

fdom.apis.register("core.oauth", OAuth_client);
