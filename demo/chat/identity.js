var rendezvousUrl = "https://script.google.com/macros/s/AKfycbwfgaSakSX6hyY_uKOLFPQhvIrp7tj3zjfwZd3PllXJV-ucmBk/exec";
var POLL_TIMEOUT = 3000;
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
  this.buddylist = [];
  
  callback = this.updateMailbox.bind(this);
  setTimeout(this.getMailbox.bind(this), 0);
  
  this.view = freedom['core.view']();
  var promise = this.view.show({
    file: "identityposter.html",
    hide: true
  });

};

IdentityProvider.prototype.get = function(continuation) {
  continuation({name: this.name});
};

IdentityProvider.prototype.send = function(to, msg, continuation) {
  //var params = "prefix=nop&cmd=send&uid=" + this.name + "&to=" + to + "&msg=" + msg;
  //sendPost(to, this.name, msg);
  this.view.postMessage({setUrl: rendezvousUrl});
  this.view.postMessage({cmd: 'send', uid: this.name, to: to, msg: msg});
  continuation();
};

IdentityProvider.prototype.getMailbox = function() {
  var req = rendezvousUrl + "?prefix=callback&cmd=get&uid=" + this.name;
  importScripts(req);
  setTimeout(this.getMailbox.bind(this), POLL_TIMEOUT);
};

IdentityProvider.prototype.updateMailbox = function(mailbox) {
  if ("buddylist" in mailbox) {
    if (this.buddylist < mailbox.buddylist || this.buddylist > mailbox.buddylist) {
      identity.emit('buddylist', mailbox.buddylist);
      this.buddylist = mailbox.buddylist;
    }
    delete mailbox.buddylist;
  }
  for (var i in mailbox) {
    for (var j in mailbox[i]) {
      identity.emit('message', {from: i, message: mailbox[i][j]});
    }
  }
};

var identity = freedom.identity();
identity.provideAsynchronous(IdentityProvider);
