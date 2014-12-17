/*jslint sloppy:true*/
/*globals freedom,console,indexedDB, exports*/
/**
 * Implementation of the Storage provider that uses indexedDB
 * Behavior:
 * - Namespace is shared with all instances of this provider.
 *   e.g. Both modules A and B use this storage provider. They'd be able to access the same keys
 **/
//TODO(ryscheng): Move to core provider for indexDB. This is deprecated.

function IndexedDBStorageProvider() {
  this.dbName = 'freedomjs';
  this.storeName = 'freedomjs';
  if (typeof freedom.storage !== 'undefined') {
    this.ERRCODE = freedom.storage().ERRCODE;
  } else if (typeof freedom.storebuffer !== 'undefined') {
    this.ERRCODE = freedom.storebuffer().ERRCODE;
  }
  this.queue = [];

  this.handle = {};
  this.handle.initializing = true;
  this.handle.db = null;
  this.handle.version = 1;
  this.handle.open = function () {
    // console.log("storage.indexeddb: opening database");
    var req = indexedDB.open(this.dbName, this.handle.version);
    req.onupgradeneeded = function (e) {
      // console.log("storage.indexeddb.onupgradedneeded");
      var db = e.target.result,
        store;
      e.target.transaction.onerror = function (e) {
        console.error(e.value);
      };
      if (!db.objectStoreNames.contains(this.storeName)) {
        store = db.createObjectStore(this.storeName, {
          keyPath: "key"
        });
      }
    }.bind(this);
    req.onsuccess = function (e) {
      // console.log("storage.indexeddb: success opening database");
      this.handle.db = e.target.result;
      this.handle.initializing = false;
      this.flushQueue();
    }.bind(this);
    req.onerror = function (e) {
      // console.log("storage.indexeddb: error opening database");
      console.error(e.value);
      this.handle.initializing = false;
      this.flushQueue();
    }.bind(this);
  }.bind(this);
  // console.log("IndexDB Storage Provider, running in worker " + self.location.href);
  this.handle.open();
}

IndexedDBStorageProvider.prototype.keys = function (continuation) {
  //this.store.keys().then(continuation);
  if (this.handle.initializing) {
    this.pushQueue("keys", null, null, continuation);
    return;
  } else if (this.handle.db === null) {
    continuation(undefined, this.createError("OFFLINE"));
    return;
  }

  // console.log('storage.indexeddb.keys');
  var transaction = this.handle.db.transaction([this.storeName], "readonly"),
    store = transaction.objectStore(this.storeName),
    request = store.openCursor(),
    retValue = [];
  request.onerror = function (cont, e) {
    cont(undefined, this.createError("UNKNOWN"));
  }.bind(this, continuation);
  request.onsuccess = function (cont, retValue, e) {
    var result = e.target.result;
    if (result === null || typeof result === 'undefined') {
      cont(retValue);
      return;
    }
    retValue.push(result.key);
    result['continue']();
  }.bind(this, continuation, retValue);
};

IndexedDBStorageProvider.prototype.get = function (key, continuation) {
  //this.store.get(key).then(continuation);
  if (this.handle.initializing) {
    this.pushQueue("get", key, null, continuation);
    return;
  } else if (this.handle.db === null) {
    continuation(undefined, this.createError("OFFLINE"));
    return;
  }

  // console.log('storage.indexeddb.get: ' + key);
  var transaction = this.handle.db.transaction([this.storeName], "readonly"),
    store = transaction.objectStore(this.storeName),
    request = store.get(key);
  request.onerror = function (cont, e) {
    cont(undefined, this.createError("UNKNOWN"));
  }.bind(this, continuation);
  request.onsuccess = function (cont, e) {
    var retValue = e.target.result ? e.target.result.value : null;
    /**
    if (retValue !== null && retValue.length) {
      console.log("storage.indexeddb.get: return string length " + retValue.length);
    } else if (retValue !== null && retValue.byteLength) {
      console.log("storage.indexeddb.get: return string length " + retValue.byteLength);
    }
    **/
    cont(retValue);
  }.bind(this, continuation);
};

IndexedDBStorageProvider.prototype.set = function (key, value, continuation) {
  //this.store.set(key, value).then(continuation);
  if (this.handle.initializing) {
    this.pushQueue("set", key, value, continuation);
    return;
  } else if (this.handle.db === null) {
    continuation(undefined, this.createError("OFFLINE"));
    return;
  }

  /**
  console.log('storage.indexeddb.set: ' + key);
  if (value !== null && value.length) {
    console.log('storage.indexeddb.set: string value length ' + value.length);
  } else if (value !== null && value.byteLength) {
    console.log('storage.indexeddb.set: buffer value length ' + value.byteLength);
  }
  **/
  var transaction = this.handle.db.transaction([this.storeName], "readwrite"),
    store = transaction.objectStore(this.storeName),
    finishPut = function (continuation, key, value, retValue) {
      var putRequest = store.put({
        key: key,
        value: value,
        timestamp: new Date().getTime()
      });
      putRequest.onerror = function (cont, e) {
        cont(undefined, this.createError("UNKNOWN"));
      }.bind(this, continuation);
      putRequest.onsuccess = function (cont, retValue, e) {
        /**
        if (retValue !== null && retValue.length) {
          console.log("storage.indexeddb.set: return string length " + retValue.length);
        } else if (retValue !== null && retValue.byteLength) {
          console.log("storage.indexeddb.set: return string length " + retValue.byteLength);
        }
        **/
        cont(retValue);
      }.bind(this, continuation, retValue);
    }.bind(this, continuation, key, value),
    getRequest = store.get(key);

  getRequest.onerror = function (finishPut, e) {
    finishPut(null);
  }.bind(this, finishPut);
  getRequest.onsuccess = function (finishPut, e) {
    if (typeof e.target.result === 'undefined') {
      finishPut(null);
    } else {
      finishPut(e.target.result.value);
    }
  }.bind(this, finishPut);

};

IndexedDBStorageProvider.prototype.remove = function (key, continuation) {
  if (this.handle.initializing) {
    this.pushQueue("remove", key, null, continuation);
    return;
  } else if (this.handle.db === null) {
    continuation(undefined, this.createError("OFFLINE"));
    return;
  }

  // console.log('storage.indexeddb.remove: ' + key);
  var transaction = this.handle.db.transaction([this.storeName], "readwrite"),
    store = transaction.objectStore(this.storeName),
    finishRemove = function (continuation, key, retValue) {
      var removeRequest = store['delete'](key);
      removeRequest.onerror = function (cont, e) {
        cont(undefined, this.createError("UNKNOWN"));
      }.bind(this, continuation);
      removeRequest.onsuccess = function (cont, retValue, e) {
        /**
        if (retValue !== null && retValue.length) {
          console.log("storage.indexeddb.remove: return string length " + retValue.length);
        } else if (retValue !== null && retValue.byteLength) {
          console.log("storage.indexeddb.remove: return string length " + retValue.byteLength);
        }
        **/
        cont(retValue);
      }.bind(this, continuation, retValue);
    }.bind(this, continuation, key),
    getRequest = store.get(key);

  getRequest.onerror = function (finishRemove, e) {
    finishRemove(null);
  }.bind(this, finishRemove);
  getRequest.onsuccess = function (finishRemove, e) {
    if (typeof e.target.result === 'undefined') {
      finishRemove(null);
    } else {
      finishRemove(e.target.result.value);
    }
  }.bind(this, finishRemove);

};

IndexedDBStorageProvider.prototype.clear = function (continuation) {
  //this.store.clear().then(continuation);
  if (this.handle.initializing) {
    this.pushQueue("clear", null, null, continuation);
    return;
  } else if (this.handle.db === null) {
    continuation(undefined, this.createError("OFFLINE"));
    return;
  }
  // console.log('storage.indexeddb.clear: clearing');
  var transaction = this.handle.db.transaction([this.storeName], "readwrite"),
    store = transaction.objectStore(this.storeName),
    request = store.clear();
  request.onerror = function (cont, e) {
    cont(undefined, this.createError("UNKNOWN"));
  }.bind(this, continuation);
  request.onsuccess = function (cont, e) {
    cont();
  }.bind(this, continuation);
};


/** INTERNAL METHODS **/
// Create an error message
IndexedDBStorageProvider.prototype.createError = function (code) {
  // console.log("Creating error: " + code);
  return {
    errcode: code,
    message: this.ERRCODE[code]
  };
};

//Insert call into queue
IndexedDBStorageProvider.prototype.pushQueue = function (method, key, value, continuation) {
  // console.log("Pushing onto queue: " + method);
  this.queue.push({
    cmd: method,
    key: key,
    value: value,
    cont: continuation
  });
};

//Flush commands in queue
IndexedDBStorageProvider.prototype.flushQueue = function () {
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
  freedom().provideAsynchronous(IndexedDBStorageProvider);
}

if (typeof exports !== 'undefined') {
  exports.provider = IndexedDBStorageProvider;
  exports.name = 'storage';
}

