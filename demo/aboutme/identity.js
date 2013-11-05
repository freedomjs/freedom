IdentityProvider.prototype.getProfile = function(continuation) {
  var view = freedom['core.view']();
  var promise = view.open({
    file: "identityview.html"
  });
  promise.done(function() {
    view.show();
  });

  var retVal = false;

  view.on('close', function() {
    if (retVal === false) {
      continuation({});
    }
  });

  view.on('message', function(identity) {
    view.close();
    var sanitized_email = identity.email.toLowerCase().trim();
    var hash = CryptoJS.MD5(sanitized_email);
    identity.imageUrl = "http://2.gravatar.com/avatar/" + hash + "?size=240";
    
    continuation(identity);
  });
};

freedom.identity().provideAsynchronous(IdentityProvider);

