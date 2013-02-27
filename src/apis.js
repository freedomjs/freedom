var fdom = fdom || {};

var api = function() {
  this.apis = {};
  this.providers = {};
}

api.prototype.get = function(api) {
  if (!this.apis[api]) {
    return false;
  }
  return {
    name: api,
    definition: this.apis[api]
  }
}

api.prototype.set = function(name, definition) {
  this.apis[name] = definition;
}

api.prototype.register = function(name, constructor) {
  this.providers[name] = constructor;
}

api.prototype.getCore = function(name, you) {
  return new coreProvider(name, you);
}

var coreProvider = function(name, channel) {
  this.instance = null;
  this.name = name;
  this.reply = channel;
}

coreProvider.prototype.postMessage = function(msg) {
  if (!this.instance) {
    var def = fdom.apis.get(this.name);
    this.instance = new fdom.Proxy.templatedDelegator(this.reply, def.definition)
    this.instance['provideAsynchronous'](fdom.apis.providers[this.name]);
  }
  this.reply['emit']('message', msg);
}

fdom.apis = new api();
