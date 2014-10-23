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
};

OAuth.handlers = [];

/**
 * Register an oAuth handler.
 *
 * @method register
 * @param {Function(String[], OAuth)} handler
 * @private
 */
OAuth.register = function (handler) {
  OAuth.handlers.push(handler);
};

/**
 * Reset the oAuth handler registrations.
 * @method reset
 * @private
 */
OAuth.reset = function () {
  OAuth.handlers = [];
};

/**
 * Indicate the initention to initiate an oAuth flow, allowing an appropriate
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
  for (i = 0; i < OAuth.handlers.length; i += 1) {
    promise = OAuth.handlers[i](redirectURIs, this);
    if (promise) {
      return promise.then(continuation);
    }
  }
  continuation(null, {
    'errcode': 'UNKNOWN',
    'message': 'No requested redirects can be handled.'
  });
};

exports.register = OAuth.register;
exports.reset = OAuth.reset;
exports.provider = OAuth;
exports.name = 'core.oauth';
