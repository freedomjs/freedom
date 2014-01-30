/**
 * Implementation of the Storage provider that thin-wraps freedom['core.storage']();
 * Behavior:
 * - Namespace is shared with all instances of this provider.
 *   e.g. Both modules A and B use this storage provider. They'd be able to access the same keys
 **/

function SharedStorageProvider() {
  this.store = freedom['core.storage']();
  //console.log("Shared Storage Provider, running in worker " + self.location.href);
}

SharedStorageProvider.prototype.keys = function(continuation) {
  var promise = this.store.keys();
  promise.done(continuation);
};

SharedStorageProvider.prototype.get = function(key, continuation) {
  var promise = this.store.get(key);
  promise.done(continuation);
};

SharedStorageProvider.prototype.set = function(key, value, continuation) {
  var promise = this.store.set(key, value);
  promise.done(continuation);
};

SharedStorageProvider.prototype.remove = function(key, continuation) {
  var promise = this.store.remove(key);
  promise.done(continuation);
};

SharedStorageProvider.prototype.clear = function(continuation) {
  var promise = this.store.clear();
  promise.done(continuation);
};

/** REGISTER PROVIDER **/
if (typeof freedom !== 'undefined') {
  freedom.storage().provideAsynchronous(SharedStorageProvider);
}
