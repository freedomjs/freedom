/**
 * Implementation of the Storage provider that thin-wraps freedom['core.storage']();
 * Behavior:
 * - Namespace is shared with all instances of this provider.
 *   e.g. Both modules A and B use this storage provider. They'd be able to access the same keys
 **/

function StorageProvider() {
  this.store = freedom['core.storage']();
  console.log("Shared Storage Provider, running in worker " + self.location.href);
}

StorageProvider.prototype.keys = function(continuation) {
  var promise = this.store.keys();
  promise.done(continuation);
};

StorageProvider.prototype.get = function(key, continuation) {
  var promise = this.store.get(key);
  promise.done(continuation);
};

StorageProvider.prototype.set = function(key, value, continuation) {
  var promise = this.store.set(key, value);
  promise.done(continuation);
};

StorageProvider.prototype.remove = function(key, continuation) {
  var promise = this.store.remove(key);
  promise.done(continuation);
};

StorageProvider.prototype.clear = function(continuation) {
  var promise = this.store.clear();
  promise.done(continuation);
};

/** REGISTER PROVIDER **/
freedom.storage().provideAsynchronous(StorageProvider);
