/**
 * Implementation of a Social provider that depends on
 * the WebSockets server code in server/router.py
 * The current implementation uses a public facing common server
 * hosted on p2pbr.com
 *
 * The provider offers
 * - A single global buddylist that everyone is on
 * - no reliability
 * - out of order delivery
 * - ephemeral userIds and clientIds
 **/

//var this.WS_URL = 'ws://localhost:8082/route/';

function WSSocialProvider(dispatchEvent) {
  this.dispatchEvent = dispatchEvent;
  this.WS_URL = 'ws://p2pbr.com:8082/route/';
  this.NETWORK_ID = 'websockets';
  var social = freedom.social();
  this.STATUS_NETWORK = social.STATUS_NETWORK;
  this.STATUS_CLIENT = social.STATUS_CLIENT;
  this.conn = null;   // Web Socket
  this.id = null;     // userId of this user
  this.roster = {};   // List of seen users
  setTimeout(this._sendStatus.bind(this,'OFFLINE', 'offline'),0);
}

/**
 * Connect to the Web Socket rendezvous server
 * e.g. social.login(Object options)
 * The only login option needed is 'agent', used to determine which group to join in the server
 *
 * @method login
 * @param {Object} loginOptions
 * @return {Object} status - Same schema as 'onStatus' events
 **/
WSSocialProvider.prototype.login = function(loginOpts, continuation) {
  if (this.conn !== null) {
    console.warn("Already logged in");
    continuation(this._sendStatus("ONLINE"));
    return;
  }
  this.conn = new WebSocket(this.WS_URL+loginOpts.agent);
  // Save the continuation until we get a status message for
  // successful login.
  this._cont = continuation;
  this.conn.onmessage = this._onMessage.bind(this);
  this.conn.onerror = (function (cont, error) {
    this.conn = null;
    this._cont(this._sendStatus('ERR_CONNECTION', error));
  }).bind(this, continuation);
  this.conn.onclose = (function (cont, msg) {
    this.conn = null;
    this._cont(this._sendStatus('OFFLINE', 'offline'));
  }).bind(this, continuation);

  this._sendStatus('CONNECTING', 'connecting');
};

/**
 * Returns all the <user card>s that we've seen so far (from 'onChange' events)
 * Note: the user's own <user card> will be somewhere in this list
 * All user cards will only consist of 1 client, where the clientId is the same as the userId
 * e.g. social.getRoster();
 *
 * @method getRoster
 * @return {Object} { List of <user cards> indexed by userId
 *    'userId1': <user card>,
 *    'userId2': <user card>,
 *     ...
 * }
 **/
WSSocialProvider.prototype.getRoster = function(continuation) {
  continuation(this.roster);
};

/** 
 * Send a message to user on your network
 * If the destination is not specified or invalid, the message is dropped
 * Note: userId and clientId are the same for this provider
 * e.g. sendMessage(String destination_id, String message)
 * 
 * @method sendMessage
 * @param {String} destination_id - target
 * @return nothing
 **/
WSSocialProvider.prototype.sendMessage = function(to, msg, continuation) {
  if (this.conn) {
    this.conn.send(JSON.stringify({to: to, msg: msg}));
  } else {
    console.error('WS Social Provider: trying to sendMessage when connection not established');
  }
  continuation();
};

/**
   * Disconnects from the Web Socket server
   * e.g. logout(Object options)
   * No options needed
   * 
   * @method logout
   * @param {Object} logoutOptions
   * @return {Object} status - same schema as 'onStatus' events
   **/
WSSocialProvider.prototype.logout = function(logoutOpts, continuation) {
  if (this.conn === null) { // We may not have been logged in
    console.warn("Already logged out");
    continuation(this._sendStatus('OFFLINE', 'offline'));
    return;
  }
  this.conn.onclose = function() {
    this.conn = null;
    continuation(this._sendStatus('OFFLINE', 'offline'));
  }.bind(this);
  this.conn.close();
};

/**
 * INTERNAL METHODS
 **/

/**
 * Dispatch an 'onStatus' event with the following status
 *
 * @method _sendStatus
 * @param {String} stat - One of the error codes in STATUS_NETWORK
 * @param {String} message - Display message in the event
 * @return {Object} - same schema as 'onStatus' event
 **/
WSSocialProvider.prototype._sendStatus = function(stat, message) {
  var result = {
    network: this.NETWORK_ID,
    userId: this.id,
    clientId: this.id,
    status: this.STATUS_NETWORK[stat],
    message: message
  };
  this.dispatchEvent('onStatus', result);
  return result;
};

/**
 * Add the following ID to the roster
 * All users only have 1 client which is always messageable
 *
 * @method _changeRoster
 * @param {String} id - userId of user
 * @return nothing
 **/
WSSocialProvider.prototype._changeRoster = function(id, online) {
  //Keep track if we've actually made changes
  var sendChange = false;
  //Create entry if not there
  if (!this.roster[id]) {
    sendChange = true;
    var c = {};
    c[id] = {
      clientId: id,
      status: this.STATUS_CLIENT["MESSAGEABLE"]
    };
    this.roster[id] = {
      userId: id,
      name: id,
      clients: c
    };
  }
  //Update online/offline status
  if (online && this.roster[id].clients[id].status !== this.STATUS_CLIENT["MESSAGEABLE"]) {
    this.roster[id].clients[id].status = this.STATUS_CLIENT["MESSAGEABLE"];
    sendChange = true;
  } else if (!online && this.roster[id].clients[id].status !== this.STATUS_CLIENT["OFFLINE"]) {
    this.roster[id].clients[id].status = this.STATUS_CLIENT["OFFLINE"];
    sendChange = true;
  }
  //Only dispatch change events if things have actually changed
  if (sendChange) {
    this.dispatchEvent('onChange', this.roster[id]);
  }
};

/**
 * Interpret messages from the server
 * There are 3 types of messages
 * - Directed messages from friends
 * - State information from the server on initialization
 * - Roster change events (users go online/offline)
 *
 * @method _onMessage
 * @param {String} msg - message from the server (see server/router.py for schema)
 * @return nothing
 **/
WSSocialProvider.prototype._onMessage = function(msg) {
  msg = JSON.parse(msg.data);
  // If state information from the server
  // Store my own ID and all known users at the time
  if (msg.cmd == 'state') {
    this.id = msg.id;
    this._changeRoster(this.id, true);
    for (var i=0; i<msg.msg.length; i++) {
      this._changeRoster(msg.msg[i], true);
    }

    if (typeof this._cont === 'function') {
      this.conn.onclose = null;
      this.conn.onerror = null;
      this._cont(this._sendStatus('ONLINE', 'online'));
      this._cont = null;
    }

    // If directed message, emit event
  } else if (msg.cmd == 'message') {
    this._changeRoster(msg.from, true);
    this.dispatchEvent('onMessage', {
      fromUserId: msg.from,
      fromClientId: msg.from,
      toUserId: this.id,
      toClientId: this.id,
      network: this.NETWORK_ID,
      message: msg.msg
    });
  // Roster change event
  } else if (msg.cmd == 'roster') {
    this._changeRoster(msg.id, msg.online);
  // No idea what this message is, but let's keep track of who it's from
  } else if (msg.from) {
    this._changeRoster(msg.from, true);
  }
};

/** REGISTER PROVIDER **/
if (typeof freedom !== 'undefined') {
  freedom.social().provideAsynchronous(WSSocialProvider);
}
