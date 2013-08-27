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

Storage_unprivileged.prototype.get = function(key, continuation) {
  try {
    var val = localStorage[this.app.manifestId + key];
    continuation(val);
  } catch(e) {
    continuation(null);
  }
};

Storage_unprivileged.prototype.set = function(key, value, continuation) {
  localStorage[this.app.manifestId + key] = value;
  continuation();
};

fdom.apis.register("core.storage", Storage_unprivileged);