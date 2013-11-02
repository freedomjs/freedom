/**
 * SOCIAL API
 *
 * API for connecting to a social network of other users
 * The implementation (provider) behind this API has full control
 * over which users to expose to other users in their roster
 *
 * Define a <client card>, as the following:
 * - Information related to a specific device or client of a user
 * {
 *   'clientId': 'string',  // Unique ID of client (e.g. alice@gmail.com/Android-23nadsv32f)
 *   'network': 'string',   // Name of network this client is logged into
 *   'status': 'string'     // Status (['messageable', 'online', 'offline'])
 *                          // 'messageable' - This client runs the same FreeDOM app as you and is online
 *                          // 'online' - This client is online, but does not run the same app
 *                          //            (i.e. can be useful to invite others to your FreeDOM app)
 *                          // 'offline' - Not logged in
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
  'status_codes': {type: 'constant', value: {
    // Not connected to any social network.
    // There are no guarantees other methods or events will work until
    // the user calls 'login'
    'OFFLINE': 0,
    // 
    'AUTHENTICATING': 1,
    'CONNECTING': 2,
    'ONLINE': 3,
    'ERR_AUTHENTICATION': -1,
    'ERR_NO_SERVER': -2
  }},

  // Store
  // e.g. var id = social.id
  'id': {type: 'property', value: 'string'},

  //Log into the network (See below for parameters)
  //e.g. login(Object options)
  //Returns same schema as onStatus
  'login': {type: 'method', value: [{
    'network': 'string',  //Network name
    'agent': 'string',    //Agent name of app
    'version': 'string',  //Version of app
    'url': 'string',      //URL of app
    'interactive': 'bool' //Prompt user?
  }]},

  //Gets the profile of a user
  //If id is null, return self
  //e.g. social.getProfile(String id);
  //Returns {
  //  'me': { // List of my cards (one for each network), indexed by userId
  //    'userMe1': <user card>,
  //    ...
  //  },
  //  'roster': { // List of my friends, indexed by userId
  //    'friend1': <user card>,
  //    'friend2': <user card>,
  //    ...
  //  }
  //}
  'getProfile': {type: 'method', value: ['string']},

  //Send a message to user on your network
  //e.g. sendMessage(String destination_id, String message)
  //Returns nothing
  'sendMessage': {type: 'method', value: ['string', 'string']},

  //Logs out of the userId on the specific network
  //If userId is null, but network is not - log out of all accounts on that network
  //If networkName is null, but userId is not - log out of that account
  //If both fields are null, log out of all accounts on all networks
  //e.g. logout(String userId, String networkName)
  //Returns same schema as onStatus
  'logout': {type: 'method', value: ['string', 'string']},

  //Event on change in profile
  //(includes changes to roster)
  //You will receive an onChange event with your own id; this will tell you
  //your name, url, and imageData.
  //Current contract is that clients grows monotonically, when clients go
  //offline, they are kept in the clients and have |status| "offline".
  'onChange': {type: 'event', value: {
    'userId': 'string',
    'name': 'string',
    'url': 'string',
    'imageData': 'string',
    'clients': 'object'
  }},

  //Event on incoming message
  'onMessage': {type: 'event', value: {
    'fromUserId': 'string',   //userId of user message is from
    'fromClientId': 'string', //clientId of user message is from
    'toUserId': 'string',     //userId of user message is to
    'toClientId': 'string',   //clientId of user message is to
    'network': 'string',      // the network id the message came from.
    'message': 'string'       //message contents
  }},

  //Event on provider status
  //NOTE: userId is not guaranteed to be present
  //  e.g. if status == ONLINE | CONNECTING, it should be present
  //       if status == OFFLINE, it could be missing if the user hasn't logged in yet
  //                    if could be present if the user just logged off
  //All other parameters are always there.
  'onStatus': {type: 'event', value: {
    'userId': 'string', //userId of network this is about
    'network': 'string',//name of the network (chosen by social provider)
    'status': 'number', //One of the constants defined in 'status_codes'
    'message': 'string' //More detailed message about status
  }}

});

