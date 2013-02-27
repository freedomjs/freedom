function IdentityProvider() {
  importScripts("http://crypto-js.googlecode.com/svn/tags/3.1.2/build/rollups/md5.js");
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
    view.close();
    var identity = m[0];
    var sanitized_email = identity.email.toLowerCase().trim();
    var hash = CryptoJS.MD5(sanitized_email);
    identity.imageUrl = "http://2.gravatar.com/avatar/" + hash + "?size=240";
    
    continuation(identity);
  });
}

freedom.identity().provideAsynchronous(IdentityProvider);
