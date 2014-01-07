/**
 * A storage provider using the browser localStorage cache.
 * @Class Storage_localstorage
 * @constructor
 * @private
 * @param {App} app The application creating this provider.
 */
var Storage_localstorage = function(app) {
  this.app = app;
  handleEvents(this);
};

/**
 * Get a key from the storage repository.
 * @param {String} key The item to get from storage.
 * @method get
 */
Storage_localstorage.prototype.get = function(key, continuation) {
  try {
    var val = localStorage[this.app.manifestId + key];
    continuation(val);
  } catch(e) {
    continuation(null);
  }
};

/**
 * Set a key in the storage repository.
 * @param {String} key The item to save in storage.
 * @param {String} value The value to save in storage.
 * @method set
 */
Storage_localstorage.prototype.set = function(key, value, continuation) {
  localStorage[this.app.manifestId + key] = value;
  continuation();
};

/**
 * Remove a key from the storage repository.
 * @param {String} key The item to remove from storage;
 * @method remove
 */
Storage_localstorage.prototype.remove = function(key, continuation) {
  localStorage.removeItem(this.app.manifestId + key);
  continuation();
};

/**
 * Reset the contents of the storage repository.
 * @method clear
 */
Storage_localstorage.prototype.clear = function(continuation) {
  // TODO(willscott): This needs to only reset state for the caller.
  localStorage.clear();
  continuation();
};

fdom.apis.register("core.storage", Storage_localstorage);
