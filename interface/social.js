/*globals fdom:true */
/*jslint indent:2,sloppy:true */
/**
 * SOCIAL API
 *
 * API for connecting to social networks and messaging of users.
 * Note that the following properties depend on the specific implementation (provider)
 * behind this API that you choose.
 * An instance of a social provider encapsulates a single user logging into a single network.
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
 * - The Social provider should output an 'onUserUpdate' event upon initialization (after constructor)
 *   with its current state.
 *
 * Define a <state card>, as the following:
 * - Information related to a specific (device, login) or client of a user
 * {
 *   'userId': 'string',   // Unique ID of user (e.g. alice@gmail.com)
 *   'clientId': 'string',  // Unique ID of client (e.g. alice@gmail.com/Android-23nadsv32f)
 *   'status': 'number'     // Status of the client. See the 'STATUS' constants
 *   'name': 'string',     // Name (e.g. Alice Underpants)
 *   'url': 'string',      // Homepage URL
 *   'imageData': 'string',// Data URI of image data (e.g. data:image/png;base64,adkwe329...)
 * }
 **/

fdom.apis.set('social', {
  /** 
   * List of error codes that can be returned in 'onStatus'
   * events. Because 'login' and 'logout' methods turn 'onStatus'
   * events, those use the same codes
  **/
  'RETCODE': {type: 'constant', value: {
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
   * List of possible statuses in the <state card>
   **/
  'STATUS': {type: 'constant', value: {
    // Not logged in
    'OFFLINE': 0,
    // This client runs the same freedom.js app as you and is online
    'ONLINE': 1,
    // This client is online, but does not run the same app (chat client)
    // (i.e. can be useful to invite others to your freedom.js app)
    'ONLINE_WITH_OTHER_CLIENT': 2
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
    'agent': 'string',    //Name of the application
    'version': 'string',  //Version of application
    'url': 'string',      //URL of application
    'interactive': 'bool' //If true, always prompt for login. If false, try with cached credentials
    'rememberLogin': 'bool' //Cache the login credentials
    'userId': 'string'    //Log in a particular user
  }]},

  /**
   * Clears the cached credentials
   * e.g. social.clearCachedCredentials()
   *
   * @method clearCachedCredentials
   * @return {}
   **/
  'clearCachedCredentials': {type: 'method', value: []},

  /**
   * Returns all the <state card>s that we've seen so far (from 'onUserUpdate' and 'onUserUpdate' events)
   * Note: the user's own <user card> will be somewhere in this list
   * e.g. social.getRoster();
   *
   * @method getRoster
   * @return {Object} { List of <user cards> indexed by userId
   *    'userId1': <state card>,
   *    'userId2': <state card>,
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
   * Logs out the user of the network
   * e.g. logout()
   * 
   * @method logout
   * @return {Object} status - same schema as 'onStatus' events
   **/
  'logout': {type: 'method', value: []},

  /**
   * Event on incoming messages
   **/
  'onMessage': {type: 'event', value: {
    'fromUserId': 'string',   // userId of user message is from
    'fromClientId': 'string', // clientId of user message is from
    'toUserId': 'string',     // userId of user message is to
    'toClientId': 'string',   // clientId of user message is to
    'message': 'string'       // message contents
  }},

  /**
   * Event that is sent on changes to a <state card> of someone on your roster
   * (e.g. if a friend comes online)
   * This event must match the schema for an entire <state card> (see above)
   * 
   * Current contract is that clients grows monotonically, when clients go
   * offline, they are kept in the clients and have |status| "OFFLINE".
   **/
  'onRosterUpdate': {type: 'event', value: {
    //REQUIRED
    'userId': 'string',   // Unique ID of user (e.g. alice@gmail.com)
    'status': 'number'    // Status of the client. See the 'STATUS' constants
    //OPTIONAL
    'clientId': 'string', // Unique ID of client (e.g. alice@gmail.com/Android-23nadsv32f)
    'name': 'string',     // Name (e.g. Alice Underpants)
    'url': 'string',      // Homepage URL (e.g. https://alice.com)
    'imageData': 'string',// Data URI of image data (e.g. data:image/png;base64,adkwe329...)
  }},

  /**
   * Event that is sent on changes to your own <state card>
   * (e.g. You get disconnected)
   **/
  'onUserUpdate': {type: 'event', value: {
    //REQUIRED
    'status': 'number'    // Status of the client. See the 'STATUS' constants
    //OPTIONAL
    'userId': 'string',   // Unique ID of user (e.g. alice@gmail.com)
    'clientId': 'string', // Unique ID of client (e.g. alice@gmail.com/Android-23nadsv32f)
    'name': 'string',     // Name (e.g. Alice Underpants)
    'url': 'string',      // Homepage URL (e.g. https://alice.com)
    'imageData': 'string',// Data URI of image data (e.g. data:image/png;base64,adkwe329...)
  }}

});

