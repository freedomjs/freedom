function SocialTransport(socialProviders, transportProviders) {
  this.social = socialProviders[0];
  this.ERRCODE = this.social.ERRCODE;
  this.STATUS = this.social.STATUS;
}

SocialTransport.prototype.on = function(tag, cb) {
  this.social.on(tag, cb);
};

SocialTransport.prototype.login = function(loginOpts) {
  var promise = this.social.login(loginOpts);
  promise.then(function(val){console.log(JSON.stringify(val));});
  return promise;
};
SocialTransport.prototype.clearCachedCredentials = function() {
  return this.social.clearCachedCredentials();
};
SocialTransport.prototype.getClients = function() {
  return this.social.getClients();
};
SocialTransport.prototype.getUsers = function() {
  return this.social.getUsers();
};
SocialTransport.prototype.sendMessage = function(to, msg) {
  return this.social.sendMessage(to, msg);
};
SocialTransport.prototype.logout = function() {
  return this.social.logout();
};
