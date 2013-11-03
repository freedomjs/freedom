/**
 *  Implementation of storage that isolates the namespace
 *  for each instantiation of this provider
 *  Behavior:
 *    e.g. Both modules A and B use this storage provider.
 *    They cannot access each other's keys
 **/
function StorageProvider() {
  this.store = freedom['core.storage']();
  // This magic needs to be replaced with something deterministic that
  // uniquely identifies its place in the dependency tree
  this.magic = self.location.href;
  console.log("Isolated Storage Provider, running in worker " + self.location.href);
}

StorageProvider.prototype.keys = function(continuation) {
  var promise = this.store.keys();
  promise.done(function(val) {
    var result = [];
    //Only return keys in my partition
    for (var i = 0; i < val.length; i++) {
      if (this.isMyKey(val[i])) {
        result.push(this.fromStoredKey(val[i]));
      }
    }
    continuation(result);
  });
};

StorageProvider.prototype.get = function(key, continuation) {
  var promise = this.store.get(this.toStoredKey(key));
  promise.done(continuation);
};

StorageProvider.prototype.set = function(key, value, continuation) {
  var promise = this.store.set(this.toStoredKey(key), value);
  promise.done(continuation);
};

StorageProvider.prototype.remove = function(key, continuation) {
  var promise = this.store.remove(this.toStoredKey(key));
  promise.done(continuation);
};

StorageProvider.prototype.clear = function(continuation) {
  var promise = this.store.keys();
  promise.done(function(keys) {
    //Only remove keys in my partition
    for (var i = 0; i < keys.length; i++) {
      if (this.isMyKey(keys[i])) {
        this.store.remove(keys[i]);
      }
    }
    continuation();
  });
};

/** INTERNAL METHODS **/
// From caller's key => stored key
// e.g. 'keyA' => 'partition1+keyA'
StorageProvider.prototype.toStoredKey = function(key) {
  return (this.magic + key);
};

// From stored key => caller's key
// e.g. 'partition1+keyA' => 'keyA'
StorageProvider.prototype.fromStoredKey = function(key) {
  return key.substr(this.magic.length);
};

// Check if this stored key is in my partition
StorageProvider.prototype.isMyKey = function(storedKey) {
  return (storeKey.substr(0, this.magic.length) == this.magic);
};

/** REGISTER PROVIDER **/
freedom.storage().provideAsynchronous(StorageProvider);
