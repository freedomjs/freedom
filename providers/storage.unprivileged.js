/**
 * A FreeDOM storage provider offers a key value store interface
 * with some level of persistance, and some size limitation.
 * @constructor
 * @private
 */
var Storage_unprivileged = function(app) {
  this.app = app;
  handleEvents(this);
};

Storage_unprivileged.prototype.keys = function(continuation) {
  var result = [];
  for (var i = 0; i < localStorage.length; i++) {
    result.push(localStorage.key(i));
  }
  continuation(result);
};

Storage_unprivileged.prototype.get = function(key, continuation) {
  try {
    var val = localStorage.getItem(this.toGlobalKey(key));
    continuation(val);
  } catch(e) {
    continuation(null);
  }
};

Storage_unprivileged.prototype.set = function(key, value, continuation) {
  localStorage.setItem(this.toGlobalKey(key), value);
  continuation();
};

Storage_unprivileged.prototype.remove = function(key, continuation) {
  localStorage.removeItem(this.toGlobalKey(key));
  continuation();
};

Storage_unprivileged.prototype.clear = function(continuation) {
  localStorage.clear();
  continuation();
};

/**
 * INTERNAL METHODS
 **/
Storage_unprivileged.prototype.toGlobalKey = function(key) {
  return (this.app.manifestId + key);
};

/** REGISTER PROVIDER **/
fdom.apis.register("core.storage", Storage_unprivileged);
