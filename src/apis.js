var fdom = fdom || {};

var api = function() {
  this.apis = {};
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

fdom.apis = new api();