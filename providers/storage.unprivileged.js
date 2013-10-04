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

Storage_unprivileged.prototype.remove = function(key, continuation) {
<<<<<<< HEAD
  delete localStorage[this.app.manifestId + key];
=======
  localStorage.removeItem(this.app.manifestId + key);
  continuation();
};

Storage_unprivileged.prototype.clear = function(continuation) {
  localStorage.clear();
>>>>>>> 0a57eca206f27838f091dd6fa94bcd8f74ceda01
  continuation();
};

fdom.apis.register("core.storage", Storage_unprivileged);
