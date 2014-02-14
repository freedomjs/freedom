/*globals freedom:true, WebSocket */
/*jslint indent:2, white:true, node:true, sloppy:true, browser:true */

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
 * @class WSSocialProvider
 * @constructor
 * @param {Function} dispatchEvent callback to signal events
 * @param {WebSocket} webSocket Alternative webSocket implementation for tests
 **/
function WSSocialProvider(dispatchEvent, webSocket) {
  this.dispatchEvent = dispatchEvent;
  this.WS_URL = 'ws://p2pbr.com:8082/route/';
  this.NETWORK_ID = 'websockets';
  var social = freedom.social();
  this.STATUS_NETWORK = social.STATUS_NETWORK;
  this.STATUS_CLIENT = social.STATUS_CLIENT;
  this.conn = null;   // Web Socket
  this.id = null;     // userId of this user
  this.roster = {};   // List of seen users

  this.provider = webSocket || WebSocket;

  setTimeout(this.sendStatus.bind(this, 'OFFLINE', 'offline'), 0);
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
  var finishLogin = {
    finished: false,
    continuation: continuation,
    finish: function(msg) {
      if (this.continuation) {
        this.continuation(msg);
        delete this.continuation;
      }
    }
  };

  if (this.conn !== null) {
    console.warn("Already logged in");
    finishLogin.finish(this.sendStatus("ONLINE"));
    return;
  }
  this.conn = new this.provider(this.WS_URL + loginOpts.agent);
  // Save the continuation until we get a status message for
  // successful login.
  this.conn.onmessage = this.onMessage.bind(this, finishLogin);
  this.conn.onerror = function (cont, error) {
    this.conn = null;
    cont.finish(this.sendStatus('ERR_CONNECTION', error));
  }.bind(this, finishLogin);
  this.conn.onclose = function (cont, msg) {
    this.conn = null;
    cont.finish(this.sendStatus('OFFLINE', 'offline'));
  }.bind(this, finishLogin);

  this.sendStatus('CONNECTING', 'connecting');
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
    continuation(this.sendStatus('OFFLINE', 'offline'));
    return;
  }
  this.conn.onclose = function(continuation) {
    this.conn = null;
    continuation(this.sendStatus('OFFLINE', 'offline'));
  }.bind(this, continuation);
  this.conn.close();
};

/**
 * INTERNAL METHODS
 **/

/**
 * Dispatch an 'onStatus' event with the following status
 *
 * @method sendStatus
 * @private
 * @param {String} stat - One of the error codes in STATUS_NETWORK
 * @param {String} message - Display message in the event
 * @return {Object} - same schema as 'onStatus' event
 **/
WSSocialProvider.prototype.sendStatus = function(stat, message) {
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
 * @method changeRoster
 * @private
 * @param {String} id - userId of user
 * @return nothing
 **/
WSSocialProvider.prototype.changeRoster = function(id, online) {
  //Keep track if we've actually made changes
  var sendChange = false,
      clients = {};
  //Create entry if not there
  if (!this.roster[id]) {
    sendChange = true;
    clients[id] = {
      clientId: id,
      network: this.NETWORK_ID,
      status: this.STATUS_CLIENT.MESSAGEABLE
    };
    this.roster[id] = {
      userId: id,
      name: id,
      clients: clients
    };
  }
  //Update online/offline status
  if (online && this.roster[id].clients[id].status !==
      this.STATUS_CLIENT.MESSAGEABLE) {
    this.roster[id].clients[id].status = this.STATUS_CLIENT.MESSAGEABLE;
    sendChange = true;
  } else if (!online && this.roster[id].clients[id].status !==
             this.STATUS_CLIENT.OFFLINE) {
    this.roster[id].clients[id].status = this.STATUS_CLIENT.OFFLINE;
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
 * @method onMessage
 * @private
 * @param {Object} continuation Function to call upon successful login
 * @param {String} msg Message from the server (see server/router.py for schema)
 * @return nothing
 **/
WSSocialProvider.prototype.onMessage = function(continuation, msg) {
  var i;

  msg = JSON.parse(msg.data);
  // If state information from the server
  // Store my own ID and all known users at the time
  if (msg.cmd === 'state') {
    this.id = msg.id;
    this.changeRoster(this.id, true);
    for (i = 0; i < msg.msg.length; i += 1) {
      this.changeRoster(msg.msg[i], true);
    }

    if (!continuation.finished) {
      continuation.finish(this.sendStatus('ONLINE', 'online'));
    }
    // If directed message, emit event
  } else if (msg.cmd === 'message') {
    this.changeRoster(msg.from, true);
    this.dispatchEvent('onMessage', {
      fromUserId: msg.from,
      fromClientId: msg.from,
      toUserId: this.id,
      toClientId: this.id,
      network: this.NETWORK_ID,
      message: msg.msg
    });
  // Roster change event
  } else if (msg.cmd === 'roster') {
    this.changeRoster(msg.id, msg.online);
  // No idea what this message is, but let's keep track of who it's from
  } else if (msg.from) {
    this.changeRoster(msg.from, true);
  }
};

/** REGISTER PROVIDER **/
if (typeof freedom !== 'undefined') {
  freedom.social().provideAsynchronous(WSSocialProvider);
}
