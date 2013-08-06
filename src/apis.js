if (typeof fdom === 'undefined') {
  fdom = {};
}

/**
 * The API registry for FreeDOM.  Used to look up requested APIs,
 * and provides a bridge for core APIs to act like normal APIs.
 * @constructor
 */
var Api = function() {
  this.apis = {};
  this.providers = {};
};

/**
 * Get an API.
 * @param {String} api The API name to get.
 * @returns {{name:String, definition:API}?} The API if registered.
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
 * @param {String} name The API name.
 * @param {API} definition The JSON object defining the API.
 */
Api.prototype.set = function(name, definition) {
  this.apis[name] = definition;
};

/**
 * Register a core API provider.
 * @param {String} name the API name.
 * @param {Function} constructor the function to create a provider for the API.
 */
Api.prototype.register = function(name, constructor) {
  this.providers[name] = constructor;
};

/**
 * Get a core API connected to a given FreeDOM module.
 * @param {String} name the API to retrieve.
 * @param {fdom.Channel} you The communication channel to the API.
 * @returns {coreProvider} A fdom.App look-alike to a local API definition.
 */
Api.prototype.getCore = function(name, you) {
  return new CoreProvider(name, you);
};

/**
 * Bind a core API to a preexisting channel.
 * @param {String} name the API to bind.
 * @param {fdom.Channel} channel The Channel to terminate with the Core API.
 */
Api.prototype.bindCore = function(name, channel) {
  var def = fdom.apis.get(name).definition;
  var endpoint = new fdom.Proxy(channel, def, true);

  var resolver = makeAbsolute.bind({});
  if (channel.app) {
    resolver = function(base, file) {
      return resolvePath(file, base);
    }.bind({}, channel.app.id);
  }
  
  endpoint['provideAsynchronous'](fdom.apis.providers[name].bind({}, channel, resolver));
  return endpoint;
};

/**
 * A core API provider, implementing the fdom.Proxy interface.
 * @param {String} name The core provider name
 * @param {fdom.Channel} channel The communication channel from the provider.
 * @constructor
 */
var CoreProvider = function(name, channel) {
  this.instance = null;
  this.name = name;
  this.channel = channel;
};

/**
 * Send a message to this core provider.
 * @param {Object} msg The message to post.
 */
CoreProvider.prototype.postMessage = function(msg) {
  if (!this.instance) {
    this.instance = fdom.apis.bindCore(this.name, this.channel);
  }
  this.channel['emit']('message', msg);
};

/**
 * Defines fdom.apis for fdom module registry and core provider registation.
 */
fdom.apis = new Api();
