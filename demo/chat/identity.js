var rendezvousUrl = "https://script.google.com/macros/s/AKfycbwfgaSakSX6hyY_uKOLFPQhvIrp7tj3zjfwZd3PllXJV-ucmBk/exec";

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
  continuation({name: makeId()});
};

IdentityProvider.prototype.getBuddyList = function(continuation) {
  continuation([makeId(), makeId()]);
};

freedom.identity().provideAsynchronous(IdentityProvider);
