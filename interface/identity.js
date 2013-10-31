fdom.apis.set('identity', {
  //Can be 'offline', 'online', 'authenticating', 'connecting' or 'error'
  'status_codes': {type: 'constant', value: {
    'OFFLINE': 0,
    'AUTHENTICATING': 1,
    'CONNECTING': 2,
    'ONLINE': 3,
    'ERR_AUTHENTICATION': -1,
    'ERR_NO_SERVER': -2
  }},
  //e.g. var id = identity.id
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
  //e.g. identity.getProfile(String id);
  //Returns {
  //  'me': {
  //    'userMe1': {                //Must internal 'userId'
  //      'userId': 'string',        //ID (e.g. alice@gmail.com) username
  //      'name': 'string',         //Name (e.g. Alice Underpants)
  //      'url': 'string',          //Homepage URL
  //      'clients': {
  //        'client1': {              //Array of clients (NOTE: key must match 'clientId' in card)
  //          'clientId': 'string',   //ID of client (e.g. alice@gmail.com/Android-23nadsv32f)
  //          'network': 'string',    //Name of network
  //          'status': 'string'      //Status (['messageable', 'online', 'offline'])
  //        },
  //        'client2': ...
  //      }
  //    },
  //    'userMe2': ...
  //  },
  //  'roster': {                 //List of friends
  //    'user1': {                //NOTE: Key must match 'userId' in user card
  //      'userId': 'string',
  //      'name': 'string',
  //      'url': string,
  //      'clients': {
  //        'client1': {          //NOTE: Key must match 'clientId' in client card
  //          'clientId': 'string',
  //          'network': 'string'
  //          'status': 'string'
  //        },
  //        'client2': ...
  //      }
  //    },
  //    'user2': ...
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
    'network': 'string',//name of the network (chosen by identity provider)
    'status': 'number', //One of the constants defined in 'status_codes'
    'message': 'string' //More detailed message about status
  }}
});

