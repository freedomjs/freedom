/**
 * Implementation of a Social provider with a fake buddylist
 * 'Other User' echos everything you send to it back to you
 * This is particularly useful when you're debugging UIs with multi-user interactions
 *
 * The provider offers
 * - a buddylist of fake users
 * - no reliability of message delivery
 * - in-order delivery
 * - clients are statically defined in the class
 * - 'Other User' is a special buddy that echos what you say back to you
 **/

function LoopbackSocialProvider(dispatchEvent) {
  this.dispatchEvent = dispatchEvent;

  //Constants
  this.time = (new Date()).getTime();
  this.userId = 'Test User';      //My userId
  this.clientId = 'Test User.0';  //My clientId
  this.social = freedom.social();

  //Populate a fake roster
  this.users = {
    "Test User": this.makeUserEntry(this.userId),
    "Other User": this.makeUserEntry("Other User"),
    'Johnny Appleseed': this.makeUserEntry('Johnny Appleseed'),
    'Betty Boop': this.makeUserEntry('Betty Boop'),
    'Big Bird': this.makeUserEntry('Big Bird'),
    'Bugs Bunny': this.makeUserEntry('Bugs Bunny'),
    'Daffy Duck': this.makeUserEntry('Daffy Duck'),
    'Kermit the Frog': this.makeUserEntry('Kermit the Frog'),
    'Minnie Mouse': this.makeUserEntry('Minnie Mouse'),
    'Porky Pig': this.makeUserEntry('Porky Pig'),
    'Swedish Chef': this.makeUserEntry('Swedish Chef'),
    'Yosemite Sam': this.makeUserEntry('Yosemite Sam')
  };
  this.clients = {};
}

// Autocreates fake rosters with variable numbers of clients
// and random statuses
LoopbackSocialProvider.prototype.makeUserEntry = function(userId) {
  return {
    userId: userId,
    name: userId,
    timestamp: this.time
  };
};

LoopbackSocialProvider.prototype.fillClients = function() {
  var STATUSES = ['ONLINE', 'OFFLINE', 'ONLINE_WITH_OTHER_APP'];
  this.clients = {
    "Test User.0": {
      'userId': this.userId,
      'clientId': this.clientId,
      'status': "ONLINE",
      'timestamp': this.time
    },
    "Other User.0": {
      'userId': "Other User",
      'clientId': "Other User.0", 
      'status': "ONLINE",
      'timestamp': this.time
    }
  };

  for (var userId in this.users) {
    if (this.users.hasOwnProperty(userId)) {
      var nclients = userId.charCodeAt(0) % 3;
      for (var i = 0; i < nclients; ++i) {
        var clientId = userId+'/-client'+i;
        this.clients[clientId] = {
          userId: userId,
          clientId: clientId,
          status: STATUSES[i],
          timestamp: this.time
        };
      }
    }
  }
  return;
};

// Log in. Options are ignored
// Roster is only emitted to caller after log in
LoopbackSocialProvider.prototype.login = function(opts, continuation) {
  if (this.clients.hasOwnProperty(this.clientId)) {
    continuation(undefined, this.social.ERRCODE["LOGIN_ALREADYONLINE"]);
    return;
  }
  this.fillClients();
  for (var userId in this.users) {
    if (this.users.hasOwnProperty(userId)) {
      this.dispatchEvent('onUserProfile', this.users[userId]);
    }
  }
  for (var clientId in this.clients) {
    if (this.clients.hasOwnProperty(clientId)) {
      this.dispatchEvent('onClientState', this.clients[clientId]);
    }
  }
  continuation(this.clients[this.clientId]);
};

// Clear credentials (there are none)
LoopbackSocialProvider.prototype.clearCachedCredentials = function(continuation) {
  return;
};

// Return the user profiles
LoopbackSocialProvider.prototype.getUsers = function(continuation) {
  continuation(this.users);
};

// Return the clients
LoopbackSocialProvider.prototype.getClients = function(continuation) {
  continuation(this.clients);
};

// Send a message to someone.
// All messages not sent to this.userId will be echoed back to self as if
// sent by 'Other User'
LoopbackSocialProvider.prototype.sendMessage = function(to, msg, continuation) {
  if (!this.clients.hasOwnProperty(to) && !this.users.hasOwnProperty(to)) {
    continuation(undefined, this.social.ERRCODE["SEND_INVALIDDESTINATION"]);
    return;
  }
  if (to === this.userId || to === this.clientId) {
    this.dispatchEvent('onMessage', {
      from: this.clients[this.clientId],
      to: this.clients[this.clientId],
      message: msg
    });
  } else {
    this.dispatchEvent('onMessage', {
      from: this.clients["Other User.0"],
      to: this.clients[this.clientId],
      message: msg
    });
  }
  continuation();
};

// Log out. All users in the roster will go offline
// Options are ignored
LoopbackSocialProvider.prototype.logout = function(continuation) {
  for (var clientId in this.clients) {
    if (this.clients.hasOwnProperty(clientId)) {
      this.clients[clientId].status = 'OFFLINE';
      this.dispatchEvent('onClientState', this.clients[clientId]);
    }
  }

  this.clients = {};
  continuation();
};

/** REGISTER PROVIDER **/
if (typeof freedom !== 'undefined') {
  freedom.social().provideAsynchronous(LoopbackSocialProvider);
}
