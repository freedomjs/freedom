/*globals console */
/*jslint indent:2,white:true,sloppy:true,node:true */

/**
 * An oAuth meta-provider allowing multiple platform-dependant
 * oAuth implementations to serve as the redirectURL for an oAuth flow.
 * The core implementations are provided in providers/oauth, and are
 * supplemented in platform-dependent repositories.
 *
 */
var OAuth = function (mod, dispatchEvent) {
  this.mod = mod;
  this.dispatchEvent = dispatchEvent;
  this.handlers = {};
};

// List of all available oAuth providers
OAuth.providers = [];

/**
 * Register an oAuth provider.
 *
 * @method register
 * @param {Function(String[], OAuth)} provider
 * @private
 */
OAuth.register = function (provider) {
  OAuth.providers.push(provider);
};

/**
 * Reset the oAuth provider registrations.
 * @method reset
 * @private
 */
OAuth.reset = function () {
  OAuth.providers = [];
};

/**
 * Indicate the intention to initiate an oAuth flow, allowing an appropriate
 * oAuth provider to begin monitoring for redirection.
 *
 * @method initiateOAuth
 * @param {string[]} redirectURIs oAuth redirection URIs registered with the
 *     provider.
 * @param {Function} continuation Function to call when sending is complete.
 * @returns {{redirect:String, state:String}} The chosen redirect URI, and
 *     State to pass to the URI on completion of oAuth.
 */
OAuth.prototype.initiateOAuth = function (redirectURIs, continuation) {
  var promise, i;
  for (i = 0; i < OAuth.providers.length; i += 1) {
    promise = OAuth.providers[i].initiateOAuth(redirectURIs, this);
    if (promise) {
      promise.then(function(result) {
        this.handlers[result.state] = OAuth.providers[i];
        continuation(result);
      });
      return;
    }
  }
  continuation(null, {
    'errcode': 'UNKNOWN',
    'message': 'No requested redirects can be handled.'
  });
};

/**
 * Continue the client-side auth flow by launching the appropriate UI
 **/
OAuth.prototype.launchAuthFlow = function(authUrl, stateObj, continuation) {
  if (!this.handlers.hasOwnProperty(stateObj.state)) {
    continuation(undefined, {
      'errcode': 'UNKNOWN',
      'message': 'You must begin the oAuth flow with initiateOAuth first'
    })
    return;
  }

  this.handlers[stateObj.state].launchAuthFlow(authUrl, stateObj).then(continuation);
};

exports.register = OAuth.register;
exports.reset = OAuth.reset;
exports.provider = OAuth;
exports.name = 'core.oauth';
