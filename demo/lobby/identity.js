function IdentityProvider() {
  this.view = freedom['core.view']();
  this.view.open({
    file: "rs.html"
  });

  this.outstanding = true;
  this.queue = [];

  this.view.on("message", function(m) {
    if (m == "ready" && this.outstanding) {
      this.view.show();
      this.view.postMessage("show");
      for (var i = 0; i < this.queue.length; i++) {
        this.queue[i]();
      }
      this.queue = [];
    }
  }.bind(this));
};

IdentityProvider.prototype.enQueue = function(f) {
  if (this.outstanding) {
    this.queue.push(f);
  } else {
    f();
  }
}

IdentityProvider.prototype.get = function(continuation) {
  this.enQueue(function() {
    this.view.postMessage("hi");
  }.bind(this));
};

IdentityProvider.prototype.send = function(to, msg, continuation) {
};

var identity = freedom.identity();
identity.provideAsynchronous(IdentityProvider);
