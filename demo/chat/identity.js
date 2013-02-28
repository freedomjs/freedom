var rendezvousUrl = "https://script.google.com/macros/s/AKfycbwfgaSakSX6hyY_uKOLFPQhvIrp7tj3zjfwZd3PllXJV-ucmBk/exec";
var index = 0;
var continuations = {};

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

function callContinuation(index, result) {
  continuations[index](result);
  delete continuations[index];
}

IdentityProvider.prototype.get = function(continuation) {
  continuation({name: this.name});
};

IdentityProvider.prototype.getBuddyList = function(continuation) {
  continuations[index] = continuation;
  var req = rendezvousUrl + "?cmd=buddylist&uid=" + this.name + "&prefix=callContinuation("+index+",";
  index++;
  importScripts(req);
};

freedom.identity().provideAsynchronous(IdentityProvider);
