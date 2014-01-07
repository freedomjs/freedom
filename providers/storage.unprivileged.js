/**
 * A FreeDOM core.storage provider that depends on localStorage
 * Thus, this only works in the context of a webpage and has
 * some size limitations.
 * Note that this can conflict with other scripts using localStorage
 * as keys are raw
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
    var val = localStorage.getItem(key);
    continuation(val);
  } catch(e) {
    continuation(null);
  }
};

Storage_unprivileged.prototype.set = function(key, value, continuation) {
  localStorage.setItem(key, value);
  continuation();
};

Storage_unprivileged.prototype.remove = function(key, continuation) {
  localStorage.removeItem(key);
  continuation();
};

Storage_unprivileged.prototype.clear = function(continuation) {
  localStorage.clear();
  continuation();
};

/** REGISTER PROVIDER **/
fdom.apis.register("core.storage", Storage_unprivileged);
