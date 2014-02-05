var Storage_chromeStorageLocal = function(app) {
  this.app = app;
  fdom.util.handleEvents(this);
};

Storage_chromeStorageLocal.prototype.keys = function(continuation) {
  chrome.storage.local.get(null, function(items){
    keys = [];
    for(var itemKey in items){
      keys.push(itemKey);
    }
    continuation(keys);
  });
};        

Storage_chromeStorageLocal.prototype.get = function(key, continuation) {
  chrome.storage.local.get(key, function(ret){
    if (ret.hasOwnProperty(key)) {
      continuation(ret[key]);
    } else {
      continuation(null);
    }
  });
};

Storage_chromeStorageLocal.prototype.set = function(key, value, continuation) {
  items = {};
  items[key] = value;
  chrome.storage.local.set(items, continuation);
};

Storage_chromeStorageLocal.prototype.remove = function(key, continuation) {
  chrome.storage.local.remove(key, continuation);
};

Storage_chromeStorageLocal.prototype.clear = function(continuation) {
  chrome.storage.local.clear(continuation);
};

