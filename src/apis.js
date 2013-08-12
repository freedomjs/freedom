if (typeof fdom === 'undefined') {
  fdom = {};
}

/**
 * The API registry for FreeDOM.  Used to look up requested APIs,
 * and provides a bridge for core APIs to act like normal APIs.
 * @Class API
 * @constructor
 */
var Api = function() {
  this.apis = {};
  this.providers = {};
};

/**
 * Get an API.
 * @method get
 * @param {String} api The API name to get.
 * @returns {{name:String, definition:API}} The API if registered.
 */
Api.prototype.get = function(api) {
  if (!this.apis[api]) {
    return false;
  }
  return {
    name: api,
    definition: this.apis[api]
  };
};

/**
 * Set an API to a definition.
 * @method set
 * @param {String} name The API name.
 * @param {API} definition The JSON object defining the API.
 */
Api.prototype.set = function(name, definition) {
  this.apis[name] = definition;
};

/**
 * Register a core API provider.
 * @method register
 * @param {String} name the API name.
 * @param {Function} constructor the function to create a provider for the API.
 */
Api.prototype.register = function(name, constructor) {
  this.providers[name] = constructor;
};

/**
 * Get a core API connected to a given FreeDOM module.
 * @method getCore
 * @param {String} name the API to retrieve.
 * @param {Channel} you The communication channel to the API.
 * @returns {CoreProvider} A fdom.App look-alike to a local API definition.
 */
Api.prototype.getCore = function(name, you) {
  return new CoreProvider(this, name, you);
};

/**
 * A core API provider, implementing the fdom.Proxy interface.
 * @param {API} api The api registry offering this provider.
 * @param {String} name The core provider name.
 * @param {Channel} channel The communication channel from the provider.
 * @class CoreProvider
 * @for API
 * @extends Proxy
 * @constructor
 * @private
 */
var CoreProvider = function(api, name, channel) {
  this.api = api;
  this.instance = null;
  this.name = name;
  this.channel = channel;
};

/**
 * Send a message to this core provider.
 * @method postMessage
 * @param {Object} msg The message to post.
 */
CoreProvider.prototype.postMessage = function(msg) {
  if (!this.instance) {
    this.instantiate();
  }
  this.channel['emit']('message', msg);
};

/**
 * Instantiates the provider abstracted by this proxy.
 * @method instantiate
 * @private
 */
CoreProvider.prototype.instantiate = function() {
  var def = this.api.get(this.name).definition;
  if (!def) {
    return false;
  }

  // TODO(willscott): determine if path resolver is really needed.
  var resolver = makeAbsolute.bind({});
  if (this.channel.app) {
    resolver = function(base, file) {
      return resolvePath(file, base);
    }.bind({}, this.channel.app.id);
  }

  // The actual provider is a proxy backed by the core service.
  this.instance = new fdom.Proxy(this.channel, def, true);
  this.instance['provideAsynchronous'](this.api.providers[this.name].bind(
    {}, this.channel, resolver));
};

/**
 * Defines fdom.apis for fdom module registry and core provider registation.
 */
fdom.apis = new Api();
