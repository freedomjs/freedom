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

var NETWORK_ID = 'loopback';
var USER_ID = 'Test User';      //My userId
var CLIENT_ID = 'Test User.0';  //My clientId

function LoopbackSocialProvider() {
  console.log("Loopback Social provider");
  this.client_codes = freedom.social().STATUS_CLIENT;
  this.net_codes = freedom.social().STATUS_NETWORK;
  //Populate a fake roster
  this.roster = {
    "Test User": {
      userId: USER_ID,
      name: USER_ID,
      clients: {'Test User.0': {
        'clientId': CLIENT_ID,
        'network': NETWORK_ID,
        'status': this.client_codes["MESSAGEABLE"]
      }}
    },
    "Other User": {
      userId: "Other User",
      name: "Other User",
      clients: {'Other User.0':{
        'clientId': "Other User.0", 
        'network': NETWORK_ID,
        'status': this.client_codes["MESSAGEABLE"]
      }}
    },
    'Johnny Appleseed': this.makeRosterEntry('Johnny Appleseed'),
    'Betty Boop': this.makeRosterEntry('Betty Boop'),
    'Big Bird': this.makeRosterEntry('Big Bird'),
    'Bugs Bunny': this.makeRosterEntry('Bugs Bunny'),
    'Daffy Duck': this.makeRosterEntry('Daffy Duck'),
    'Kermit the Frog': this.makeRosterEntry('Kermit the Frog'),
    'Minnie Mouse': this.makeRosterEntry('Minnie Mouse'),
    'Porky Pig': this.makeRosterEntry('Porky Pig'),
    'Swedish Chef': this.makeRosterEntry('Swedish Chef'),
    'Yosemite Sam': this.makeRosterEntry('Yosemite Sam')
  };
  // Send an offline status on start
  setTimeout((function() {
    this.dispatchEvent('onStatus', this.makeOnStatus('OFFLINE'));
  }).bind(this), 0);
}

// Generate an 'onStatus' message
LoopbackSocialProvider.prototype.makeOnStatus = function(stat) {
  return {
    network: NETWORK_ID,
    userId: USER_ID,
    clientId: CLIENT_ID,
    status: this.net_codes[stat],
    message: "Woo!"
  };
};

// Autocreates fake rosters with variable numbers of clients
// and random statuses
LoopbackSocialProvider.prototype.makeRosterEntry = function(userId, opts) {
  var STATUSES = ['MESSAGEABLE', 'ONLINE', 'OFFLINE'];
  opts = opts || {};
  var entry = {
    userId: userId,
    name: opts.name || userId,
  };
  if (opts.clients) {
    entry.clients = opts.clients;
  } else {
    var clients = {};
    var nclients = userId.charCodeAt(0) % 3;
    for (var i = 0; i < nclients; ++i) {
      var clientId = userId+'/-client'+i;
      clients[clientId] = {
        clientId: clientId,
        network: NETWORK_ID,
        status: this.client_codes[STATUSES[i]]
      };
    }
    entry.clients = clients;
  }
  return entry;
};

// Log in. Options are ignored
// Roster is only emitted to caller after log in
LoopbackSocialProvider.prototype.login = function(opts, continuation) {
  var ret = this.makeOnStatus('ONLINE');
  for (var id in this.roster) {
    if (this.roster.hasOwnProperty(id)) {
      this.dispatchEvent('onChange', this.roster[id]);
    }
  }
  this.dispatchEvent('onStatus', ret);
  continuation(ret);
};

// Return the roster
LoopbackSocialProvider.prototype.getRoster = function(continuation) {
  continuation(this.roster);
};

// Send a message to someone.
// All messages not sent to USER_ID will be echoed back to self as if
// sent by 'Other User'
LoopbackSocialProvider.prototype.sendMessage = function(to, msg, continuation) {
  var message;
  if (to === USER_ID) {
    message = {
      fromUserId: USER_ID,
      fromClientId: CLIENT_ID,
      toUserId: USER_ID,
      toClientId: CLIENT_ID,
      network: NETWORK_ID,
      message: msg
    };
  } else {
    message = {
      fromUserId: "Other User",
      fromClientId: "Other User.0",
      toUserId: USER_ID,
      toClientId: CLIENT_ID,
      network: NETWORK_ID,
      message: msg
    };
  }
  this.dispatchEvent('onMessage', message);
  continuation();
};

// Log out. All users in the roster will go offline
// Options are ignored
LoopbackSocialProvider.prototype.logout = function(opts, continuation) {
  var ret = this.makeOnStatus('OFFLINE');
  // Remove all clients in the roster and emit these changes
  for (var id in this.roster) {
    if (this.roster.hasOwnProperty(id)) {
      var card = JSON.parse(JSON.stringify(this.roster[id]));
      card.clients = {};
      this.dispatchEvent('onChange', card);
    }
  }
  this.dispatchEvent('onStatus', ret);
  continuation(ret);
};

/** REGISTER PROVIDER **/
if (typeof freedom !== 'undefined') {
  freedom.social().provideAsynchronous(LoopbackSocialProvider);
}
