function IdentityProvider() {
}

IdentityProvider.prototype.get = function(query) {
  return {
    name: "First Last",
    email: "email@domain.com",
    imageUrl: "http://2.gravatar.com/avatar/0cd1738d6f880285b11edd5393ad1cce?size=240"
  };
}

freedom.identity().provideSynchronous(IdentityProvider);
