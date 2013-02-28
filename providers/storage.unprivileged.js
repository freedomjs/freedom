/**
 * A FreeDOM storage provider offers a key value store interface
 * with some level of persistance, and some size limitation.
 */
var Storage_unprivileged = function(channel) {
  this.channel = channel;
  handleEvents(this);
};

Storage_unprivileged.prototype.get = function(key, continuation) {
  try {
    var val = localStorage[this.channel.app.id + key];
    continuation(val);
  } catch(e) {
    continuation(null);
  }
}

Storage_unprivileged.prototype.set = function(key, value, continuation) {
  localStorage[this.channel.app.id + key] = value;
  continuation();
}

fdom.apis.register("core.storage", Storage_unprivileged);