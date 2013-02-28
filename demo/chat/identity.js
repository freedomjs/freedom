function IdentityProvider() {
  this.name = makeId();
}

function makeId(){
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for( var i=0; i < 5; i++ ) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

IdentityProvider.prototype.get = function(continuation) {
  continuation({name: this.name});
};

IdentityProvider.prototype.getBuddyList = function(continuation) {
  continuation([makeId(), makeId()]);
};

freedom.identity().provideAsynchronous(IdentityProvider);
