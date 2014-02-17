/*globals fdom:true, Promise */
/*jslint indent:2,white:true,node:true,sloppy:true */
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
  this.waiters = {};
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
  var i;

  this.providers[name] = constructor;

  if (this.waiters[name]) {
    for (i = 0; i < this.waiters[name].length; i += 1) {
      this.waiters[name][i][0](constructor.bind({},
          this.waiters[name][i][2]));
    }
    delete this.waiters[name];
  }
};

/**
 * Get a core API connected to a given FreeDOM module.
 * @method getCore
 * @param {String} name the API to retrieve.
 * @param {port.App} from The instantiating App.
 * @returns {Promise} A promise of a fdom.App look-alike matching
 * a local API definition.
 */
Api.prototype.getCore = function(name, from) {
  return new Promise(function(resolve, reject) {
    if (this.apis[name]) {
      if (this.providers[name]) {
        resolve(this.providers[name].bind({}, from));
      } else {
        if (!this.waiters[name]) {
          this.waiters[name] = [];
        }
        this.waiters[name].push([resolve, reject, from]);
      }
    } else {
      fdom.debug.warn('Api.getCore asked for unknown core: ' + name);
      reject(null);
    }
  }.bind(this));
};

/**
 * Defines fdom.apis for fdom module registry and core provider registation.
 */
fdom.apis = new Api();
