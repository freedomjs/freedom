/**
 * Implementation of the Storage provider that uses indexedDB
 * Behavior:
 * - Namespace is shared with all instances of this provider.
 *   e.g. Both modules A and B use this storage provider. They'd be able to access the same keys
 **/

function IndexedDBStorageProvider() {
  this.dbName = 'freedomjs';
  this.storeName = 'freedomjs';
  this.freedomStorage = freedom.storage();
  this.queue = [];

  this.handle = {};
  this.handle.initializing = true;
  this.handle.db = null;
  this.handle.version = 1;
  this.handle.open = function() {
    console.log("storage.indexeddb: opening database");
    var req = indexedDB.open(this.dbName, this.version);
    req.onupgradeneeded = function(e) {
      console.log("storage.indexeddb.onupgradedneeded");
      var db = e.target.result;
      var store;
      e.target.transaction.onerror = function(e) {
        console.error(e.value);
      };
      if (!db.objectStoreNames.contains(this.storeName)) {
        store = db.createObjectStore(this.storeName, {
          keyPath: "key"
        });
      } 
    }.bind(this);
    req.onsuccess = function(e) {
      console.log("storage.indexeddb: success opening database");
      this.handle.db = e.target.result;
      this.initializing = false;
      this._flushQueue();
    }.bind(this);
    req.onerror = function(e) {
      console.log("storage.indexeddb: error opening database");
      console.error(e.value);
      this.initializing = false;
      this._flushQueue();
    }.bind(this);
  }.bind(this);
  console.log("IndexDB Storage Provider, running in worker " + self.location.href);
  this.handle.open();
}

IndexedDBStorageProvider.prototype.keys = function(continuation) {
  this.store.keys().then(continuation);
};

IndexedDBStorageProvider.prototype.get = function(key, continuation) {
  //this.store.get(key).then(continuation);
  if (this.handle.initializing) {
    this._pushQueue("get", key, null, continuation);
    return;
  } else if (this.handle.db === null) {
    continuation(undefined, this._createError("OFFLINE"));
    return;
  }

  console.log('storage.indexeddb.get: ' + key);
  var transaction = this.handle.db.transaction([ this.storeName ] , "readonly" );
  var store = transaction.objectStore(this.storeName);
  var request = store.get(key);
  request.onerror = function(cont, e) {
    console.log("get error");
    cont(null);
  }.bind(this, continuation);
  request.onsuccess = function(cont, e) {
    console.log("get success");
    cont(e.target.result);
  }.bind(this, continuation);
};

IndexedDBStorageProvider.prototype.set = function(key, value, continuation) {
  //this.store.set(key, value).then(continuation);
  if (this.handle.initializing) {
    this._pushQueue("set", key, value, continuation);
    return;
  } else if (this.handle.db === null) {
    continuation(undefined, this._createError("OFFLINE"));
    return;
  }

  console.log('storage.indexeddb.set: ' + key);
  var transaction = this.handle.db.transaction([ this.storeName ] , "readwrite" );
  var store = transaction.objectStore(this.storeName);
  var request = store.put({
    key: key,
    value: value,
    timestamp: new Date().getTime()
  });
  request.onerror = function(cont, e) {
    cont(undefined, this._createError("UNKNOWN"));
  }.bind(this, continuation);
  request.onsuccess = function(cont, e) {
    cont("asdf");
  }.bind(this, continuation);
};

IndexedDBStorageProvider.prototype.remove = function(key, continuation) {
  this.store.remove(key).then(continuation);
};

IndexedDBStorageProvider.prototype.clear = function(continuation) {
  //this.store.clear().then(continuation);
  console.log("!!!");
  if (this.handle.initializing) {
    this._pushQueue("clear", null, null, continuation);
    return;
  } else if (this.handle.db === null) {
    continuation(undefined, this._createError("OFFLINE"));
    return;
  }
  console.log('storage.indexeddb.clear: clearing');
  var transaction = this.handle.db.transaction([ this.storeName ] , "readwrite" );
  var store = transaction.objectStore(this.storeName);
  var request = store.clear();
};


/** INTERNAL METHODS **/
// Create an error message
IndexedDBStorageProvider.prototype._createError = function(code) {
  console.log("Creating error: " + code);
  return {
    errcode: code,
    message: this.freedomStorage.ERRCODE[code]
  };
};

//Insert call into queue
IndexedDBStorageProvider.prototype._pushQueue = function(method, key, value, continuation) {
  console.log("Pushing onto queue: " + method);
  this.queue.push({
    cmd: method,
    key: key,
    value: value,
    cont: continuation
  });
};

//Flush commands in queue
IndexedDBStorageProvider.prototype._flushQueue = function() {
  var i, elt;
  for (i = 0; i < this.queue.length; i += 1) {
    elt = this.queue[i];
    if (elt.cmd === "keys") {
      this.keys(elt.cont);
    } else if (elt.cmd === "get") {
      this.get(elt.key, elt.cont);
    } else if (elt.cmd === "set") {
      this.set(elt.key, elt.value, elt.cont);
    } else if (elt.cmd === "remove") {
      this.remove(elt.key, elt.cont);
    } else if (elt.cmd === "clear") {
      this.clear(elt.cont);
    } else {
      console.error("IndexedDB Storage: unrecognized command " + JSON.stringify(elt));
    }
  }
  this.queue = [];
};


/** REGISTER PROVIDER **/
if (typeof freedom !== 'undefined') {
  freedom.storage().provideAsynchronous(IndexedDBStorageProvider);
}
