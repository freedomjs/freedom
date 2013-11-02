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
    for (var i = 0; i < val.length; i++) {
      result.push(this.fromGlobalKey(val[i]));
    }
    continuation(result);
  });
};

StorageProvider.prototype.get = function(key, continuation) {
  var promise = this.store.get(this.toGlobalKey(key));
  promise.done(continuation);
};

StorageProvider.prototype.set = function(key, value, continuation) {
  var promise = this.store.set(this.toGlobalKey(key), value);
  promise.done(continuation);
};

StorageProvider.prototype.remove = function(key, continuation) {
  var promise = this.store.remove(this.toGlobalKey(key));
  promise.done(continuation);
};

StorageProvider.prototype.clear = function(continuation) {
  var promise = this.store.clear();
  promise.done(continuation);
};

/** INTERNAL METHODS **/
// From caller's key => stored key
// e.g. 'keyA' => 'partition1+keyA'
StorageProvider.prototype.toGlobalKey = function(key) {
  return (this.magic + key);
};

// From stored key => caller's key
// e.g. 'partition1+keyA' => 'keyA'
StorageProvider.prototype.fromGlobalKey = function(key) {
  return key.substr(this.magic.length);
};

/** REGISTER PROVIDER **/
freedom.storage().provideAsynchronous(StorageProvider);
