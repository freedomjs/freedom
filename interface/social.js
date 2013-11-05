/**
 * SOCIAL API
 *
 * API for connecting to social networks and messaging of users.
 * Note that the following properties depend on the specific implementation (provider)
 * behind this API that you choose.
 * Depending on the Social provider, it may also expose multiple networks simultaneously.
 * In this case, you may 'login' to each separately and receive multiple <user cards> for yourself.
 * Note that the network identifier will be exposed in 'onStatus' events.
 * It is highly advised to react to 'onStatus' events, as opposed to hardcoding in network identifiers,
 * as these identifiers are subject to change.
 *
 * Variable properties dependent on choice of provider:
 * - Edges in the social network (who is on your roster)
 * - Reliable message passing (or unreliable)
 * - In-order message delivery (or out of order)
 * - Persistent clientId - Whether your clientId changes between logins when
 *    connecting from the same device
 *
 * Invariants across all providers:
 * - The userId for each user does not change between logins
 * - The Social provider should output an 'onStatus' event upon initialization (after constructor)
 *   with its current state.
 *
 * Define a <client card>, as the following:
 * - Information related to a specific device or client of a user
 * {
 *   'clientId': 'string',  // Unique ID of client (e.g. alice@gmail.com/Android-23nadsv32f)
 *   'network': 'string',   // Name of network this client is logged into
 *   'status': 'number'     // Status of the client. See the 'STATUS_CLIENT' constants
 * }
 *
 * Define a <user card>, as the following:
 * - Information related to a specific user, who may have multiple client devices
 * {
 *    'userId': 'string',   // Unique ID of user (e.g. alice@gmail.com)
 *    'name': 'string',     // Name (e.g. Alice Underpants)
 *    'url': 'string',      // Homepage URL
 *    'imageData': 'string',// Data URI of image data (e.g. data:image/png;base64,adkwe329...)
 *    'clients': {          // List of clients indexed by their clientId
 *      'client1': <client card>, 
 *      'client2': <client card>,
 *      ...
 *    }
 * }
 **/

fdom.apis.set('social', {
  /** 
   * List of error codes that can be returned in 'onStatus'
   * events. Because 'login' and 'logout' methods turn 'onStatus'
   * events, those use the same codes
  **/
  'STATUS_NETWORK': {type: 'constant', value: {
    // Not connected to any social network.
    // There are no guarantees other methods or events will work until
    // the user calls 'login'
    'OFFLINE': 0,
    // Fetching login credentials or authorization tokens
    'AUTHENTICATING': 1,
    // Connecting to the social network
    'CONNECTING': 2,
    // Online!
    'ONLINE': 3,
    // Error with authenticating to the server
    'ERR_AUTHENTICATION': -1,
    // Error with connecting to the server
    'ERR_CONNECTION': -2
  }},
  
  /**
   * List of possible statuses in the <client card>
   **/
  'STATUS_CLIENT': {type: 'constant', value: {
    // Not logged in
    'OFFLINE': 0,
    // This client is online, but does not run the same app
    // (i.e. can be useful to invite others to your FreeDOM app)
    'ONLINE': 1,
    // This client runs the same FreeDOM app as you and is online
    'MESSAGEABLE': 2
  }},

  /**
   * Stores a list of your userId's
   * NOTE: This is not yet implemented because 'property' is not working
   * e.g. var id = social.id
   **/
  'id': {type: 'property', value: ['string']},

  /**
   * Log into the network (See below for parameters)
   * e.g. social.login(Object options)
   *
   * @method login
   * @param {Object} loginOptions - See below
   * @return {Object} status - Same schema as 'onStatus' events
   **/
  'login': {type: 'method', value: [{
    'network': 'string',  //Network name (as emitted by 'onStatus' events)
    'agent': 'string',    //Name of the application
    'version': 'string',  //Version of application
    'url': 'string',      //URL of application
    'interactive': 'bool' //Prompt user for login if credentials not cached?
  }]},

  /**
   * Returns all the <user card>s that we've seen so far (from 'onChange' events)
   * Note: the user's own <user card> will be somewhere in this list
   * e.g. social.getRoster();
   *
   * @method getRoster
   * @return {Object} { List of <user cards> indexed by userId
   *    'userId1': <user card>,
   *    'userId2': <user card>,
   *     ...
   * }
   **/
  'getRoster': {type: 'method', value: []},

  /** 
   * Send a message to user on your network
   * If the message is sent to a userId, it is sent to all clients
   * If the message is sent to a clientId, it is sent to just that one client
   * If the destination is not specified or invalid, the message is dropped
   * e.g. sendMessage(String destination_id, String message)
   * 
   * @method sendMessage
   * @param {String} destination_id - target
   * @param {String} message
   * @return nothing
   **/
  'sendMessage': {type: 'method', value: ['string', 'string']},

  /**
   * Logs out the specific user of the specified network
   * If userId is null, but network is not - log out of all accounts on that network
   * If networkName is null, but userId is not - log out of that account
   * If both fields are null, log out of all accounts on all networks
   * e.g. logout(Object options)
   * 
   * @method logout
   * @param {Object} logoutOptions - see below 
   * @return {Object} status - same schema as 'onStatus' events
   **/
  'logout': {type: 'method', value: [{
    'network': 'string',  // Network to log out of
    'userId': 'string'    // User to log out
  }]},

  /**
   * Event that is sent on changes to a <user card> 
   * (for either yourself or one of your friends)
   * This event must match the schema for an entire <user card> (see above)
   * 
   * Current contract is that clients grows monotonically, when clients go
   * offline, they are kept in the clients and have |status| "offline".
   **/
  'onChange': {type: 'event', value: {
    'userId': 'string',     // Unique identifier of the user (e.g. alice@gmail.com)
    'name': 'string',       // Display name (e.g. Alice Foo)
    'url': 'string',        // Homepage URL (e.g. https://alice.com)
    'imageData': 'string',  // Data URI of image binary (e.g. data:image/png;base64,adkwe3...)
    'clients': 'object'     // List of clients keyed by clientId
  }},

  /**
   * Event on incoming messages
   **/
  'onMessage': {type: 'event', value: {
    'fromUserId': 'string',   // userId of user message is from
    'fromClientId': 'string', // clientId of user message is from
    'toUserId': 'string',     // userId of user message is to
    'toClientId': 'string',   // clientId of user message is to
    'network': 'string',      // the network id the message came from.
    'message': 'string'       // message contents
  }},

  /**
   * Events describing the connection status of a particular network
   * NOTE: userId is not guaranteed to be present
   * e.g. if status == ONLINE | CONNECTING, it should be present
   *      if status == OFFLINE, it could be missing if the user hasn't logged in yet
   *                     if could be present if the user just logged off
   * All other parameters are always there.
   **/
  'onStatus': {type: 'event', value: {
    'network': 'string',  // Name of the network (chosen by social provider)
    'userId': 'string',   // userId of myself on this network
    'clientId': 'string', // clientId of my client on this network
    'status': 'number',   // One of the constants defined in 'STATUS_NETWORK'
    'message': 'string'   // More detailed message about status
  }}

});

