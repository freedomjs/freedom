/**
 *  Implementation of storage that isolates the namespace
 *  for each instantiation of this provider
 *  Behavior:
 *    e.g. Both modules A and B use this storage provider.
 *    They cannot access each other's keys
 **/
window = {};

function StorageProvider() {
  console.log("Isolated Storage Provider, running in worker " + self.location.href);
  window.current = this;
  this.core = freedom['core']();
  this.store = freedom['core.storage']();
  this.magic = "";
  this.queue = [];

  this.core.getId().done((function (val) {
    for (var i =0; i < val.length; i++) {
      this.magic += val[i] + ";";
    }
    this.flushQueue();
  }).bind(this));
}

StorageProvider.prototype.keys = function(continuation) {
  if (this.magic === "") {
    this.pushQueue("keys", null, null, continuation);
    return;
  }

  var promise = this.store.keys();
  promise.done((function(val) {
    var result = [];
    //Check that our magic has been initialized
    //Only return keys in my partition
    for (var i = 0; i < val.length; i++) {
      if (this.isMyKey(val[i])) {
        result.push(this.fromStoredKey(val[i]));
      }
    }
    continuation(result);
  }).bind(this));
};

StorageProvider.prototype.get = function(key, continuation) {
  if (this.magic === "") {
    this.pushQueue("get", key, null, continuation);
    return;
  } 
  
  var promise = this.store.get(this.toStoredKey(key));
  promise.done(continuation);
};

StorageProvider.prototype.set = function(key, value, continuation) {
  if (this.magic === "") {
    this.pushQueue("set", key, value, continuation);
    return;
  }

  var promise = this.store.set(this.toStoredKey(key), value);
  promise.done(continuation);
};

StorageProvider.prototype.remove = function(key, continuation) {
  if (this.magic === "") {
    this.pushQueue("remove", key, null, continuation);
    return;
  }
  
  var promise = this.store.remove(this.toStoredKey(key));
  promise.done(continuation);
};

StorageProvider.prototype.clear = function(continuation) {
  var promise = this.store.keys();
  promise.done((function(keys) {
    //Only remove keys in my partition
    for (var i = 0; i < keys.length; i++) {
      if (this.isMyKey(keys[i])) {
        this.store.remove(keys[i]);
      }
    }
    continuation();
  }).bind(this));
};

/** INTERNAL METHODS **/
//Insert call into queue
StorageProvider.prototype.pushQueue = function(method, key, value, continuation) {
  this.queue.push({
    cmd: method,
    key: key,
    value: value,
    cont: continuation
  });
};

//Flush commands in queue
StorageProvider.prototype.flushQueue = function() {
  for (var i = 0; i < this.queue.length; i++) {
    var elt = this.queue[i];
    if (elt.cmd == "keys") {
      this.keys(elt.cont);
    } else if (elt.cmd == "get") {
      this.get(elt.key, elt.cont);
    } else if (elt.cmd == "set") {
      this.set(elt.key, elt.value, elt.cont);
    } else if (elt.cmd == "remove") {
      this.remove(elt.key, elt.cont);
    } else {
      console.error("Isolated Storage: unrecognized command " + JSON.stringify(elt));
    }
  }

  this.queue = [];
};

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
  return (storedKey.substr(0, this.magic.length) == this.magic);
};

/** REGISTER PROVIDER **/
freedom.storage().provideAsynchronous(StorageProvider);
