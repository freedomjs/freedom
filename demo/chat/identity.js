var rendezvousUrl = "https://script.google.com/macros/s/AKfycbwfgaSakSX6hyY_uKOLFPQhvIrp7tj3zjfwZd3PllXJV-ucmBk/exec";
var POLL_TIMEOUT = 3000;
var getMailbox;
var callback;


function IdentityProvider() {
  function makeId(){
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for( var i=0; i < 5; i++ ) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  };

  this.name = makeId();
  this.handlers = {};
  this.buddylist = [];
  
  callback = this.updateMailbox.bind(this);
  getMailbox = this.getMailbox.bind(this);
  getMailbox();
}

IdentityProvider.prototype.get = function(continuation) {
  continuation({name: this.name});
};

IdentityProvider.prototype.on = function(evt, handler) {
  console.log("WOOO"+evt);
  this.handlers[evt] = handler;
}

IdentityProvider.prototype.send = function(to, msg, continuation) {
  var req = rendezvousUrl + "?prefix=console.log&cmd=send&uid=" + this.name + "&to=" + to + "&msg=" + msg;
  importScripts(req);
}

IdentityProvider.prototype.getMailbox = function() {
  var req = rendezvousUrl + "?prefix=callback&cmd=get&uid=" + this.name;
  importScripts(req);
  setTimeout(getMailbox, POLL_TIMEOUT);
}

IdentityProvider.prototype.updateMailbox = function(mailbox) {
  if ("buddylist" in mailbox) {
    if (this.buddylist < mailbox.buddylist || this.buddylist > mailbox.buddylist) {
      this.handlers['buddylist'](mailbox.buddylist);
      this.buddylist = mailbox.buddylist;
    }
    delete mailbox.buddylist
  }
  for (var i in mailbox) {
    for (var j in mailbox[i]) {
      this.handlers['message'](i+":"+mailbox[i][j]);
    }
  }
}

freedom.identity().provideAsynchronous(IdentityProvider);
