function IdentityProvider() {
  this.name = "First Last";
  this.email = "email@domain.com";
  this.imageUrl = "http://2.gravatar.com/avatar/0cd1738d6f880285b11edd5393ad1cce?size=240";
}

IdentityProvider.prototype.get = function(continuation) {
  continuation({
    name: this.name,
    email: this.email,
    imageUrl: this.imageUrl
  });
}

freedom.identity().provideAsynchronous(IdentityProvider);

setTimeout(function() {
  var thing = freedom['core.view']();
  var promise = thing.show();
}, 0);
