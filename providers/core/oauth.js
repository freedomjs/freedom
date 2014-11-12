/*globals console */
/*jslint indent:2,white:true,sloppy:true,node:true */

/**
 * An oAuth meta-provider allowing multiple platform-dependant
 * oAuth implementations to serve as the redirectURL for an oAuth flow.
 * The core implementations are provided in providers/oauth, and are
 * supplemented in platform-dependent repositories.
 *
 */
var OAuth = function (handlers, mod, dispatchEvent) {
  this.handlers = handlers;
  this.mod = mod;
  this.dispatchEvent = dispatchEvent;
};

/**
 * Register oAuth handlers.
 * This method should be called before provider is used, and binds the current
 * oAuth provider to be associated with registered handlers. This is used so
 * that handlers which are registered by the user apply only the the freedom()
 * setup call they are associated with, while still being registered across
 * multiple instances of OAuth providers.
 *
 * @method register
 * @param {[Function(onAvailable)]} handlers
 * @private
 */
OAuth.register = function (handlers) {
  var i,
      boundHandlers = [],
      addHandler = function (h) {
        boundHandlers.push(h);
      };
  if (!handlers || !handlers.length) {
    return OAuth.reset();
  }

  for (i = 0; i < handlers.length; i += 1) {
    handlers[i](addHandler);
  }
  exports.provider = OAuth.bind(this, boundHandlers);
};

/**
 * Reset the oAuth handler registrations.
 * @method reset
 * @private
 */
OAuth.reset = function () {
  exports.provider = OAuth.bind(this, []);
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
  for (i = 0; i < this.handlers.length; i += 1) {
    promise = this.handlers[i](redirectURIs, this);
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
exports.provider = OAuth.bind(this, []);
exports.name = 'core.oauth';
