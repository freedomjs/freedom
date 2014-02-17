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
  this.store.keys().then(continuation);
};

SharedStorageProvider.prototype.get = function(key, continuation) {
  this.store.get(key).then(continuation);
};

SharedStorageProvider.prototype.set = function(key, value, continuation) {
  this.store.set(key, value).then(continuation);
};

SharedStorageProvider.prototype.remove = function(key, continuation) {
  this.store.remove(key).then(continuation);
};

SharedStorageProvider.prototype.clear = function(continuation) {
  this.store.clear().then(continuation);
};

/** REGISTER PROVIDER **/
if (typeof freedom !== 'undefined') {
  freedom.storage().provideAsynchronous(SharedStorageProvider);
}
