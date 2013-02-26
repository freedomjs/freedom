function IdentityProvider() {
  this.name = "First Last";
  this.email = "email@domain.com";
  this.imageUrl = "http://2.gravatar.com/avatar/0cd1738d6f880285b11edd5393ad1cce?size=240";
}

IdentityProvider.prototype.get = function(continuation) {
  var view = freedom['core.view']();
  var promise = view.show({
    file: "identityview.html",
    widgets: true
  });

  var retVal = false;

  view.on('close', function() {
    if (retVal === false) {
      continuation({});
    }
  });

  view.on('message', function(m) {
    console.log(m);
    //TODO(willscott): once signed in, get data.
    continuation(m);
  });
}

freedom.identity().provideAsynchronous(IdentityProvider);
