/**
 * This is the root module of freedom.js.
 * It runs in an isolated thread with its own namespace.
 * The root module has a special object 'freedom', which
 * is used to provide the interface defined in manifest.json
 **/
var Counter = function(dispatchEvents, base) {
  this.num = base;
};

Counter.prototype.click = function(num) {
  this.num += num;
  return this.num;
};

freedom().provideSynchronous(Counter);
