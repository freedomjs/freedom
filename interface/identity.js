fdom.apis.set("identity", {
  //Stores the 'ID' for logged in user (alice@gmail.com)
  //e.g. var id = identity.id
  'id': {type: "property", value: "string"},
  //Log into the network
  //e.g. login(String agent, String version, String url)
  //Returns {
  //  'success': 'boolean',
  //  'userId': 'string'
  //  'message': 'string'
  //}
  'login': {type: "method", value: ["string", "string", "string"]},
  //Gets the profile of a user
  //If id is null, return self
  //e.g. identity.getProfile(String id);
  //Returns {
  //  'me': {
  //    'userId': 'string',       //ID (e.g. alice@gmail.com) username
  //    'name': 'string',         //Name (e.g. Alice Underpants)
  //    'url': 'string',          //Homepage URL
  //    'clients': {
  //      'client1': {              //Array of clients (NOTE: key must match 'clientId' in client card
  //        'clientId': 'string',   //ID of client (e.g. alice@gmail.com/Android-23nadsv32f)
  //        'status': 'string'      //Status (['messageable', 'online', 'offline'])
  //      }, 
  //      'client2': ...
  //    }
  //  },
  //  'roster': {                 //List of friends
  //    'user1': {                //NOTE: Key must match 'userId' in user card
  //      'userId': 'string',
  //      'name': 'string',
  //      'url': string,
  //      'clients': {
  //        'client1': {          //NOTE: Key must match 'clientId' in client card
  //          'clientId': 'string',
  //          'status': 'string'
  //        },
  //        'client2': ...
  //      }
  //    },
  //    'user2': ...
  //  }
  //}
  'getProfile': {type: "method", value: ["string"]},
  //Send a message to user on your network
  //e.g. sendMessage(String destination_id, String message)
  //Returns nothing
  'sendMessage': {type: "method", value: ["string", "string"]},
  //Logs out of the network
  //e.g. logout()
  //Returns {
  //  'success': 'boolean',
  //  'message': 'string'
  //}
  'logout': {type: "method", value: []},
  //Event on change in profile
  //(includes changes to roster)
  'onChange': {type: "event", value: {
    'userId': 'string',
    'name': 'string',
    'url': 'string',
    'clients': 'object'
  }},
  //Event on incoming message
  'onMessage': {type: "event", value: {
    "fromUserId": "string",   //userId of user message is from
    "fromClientId": "string", //clientId of user message is from
    "toUserId": "string",     //userId of user message is to
    "toClientId": "string",   //clientId of user message is to
    "message": "object"       //message contents
  }},
  //Event on provider status
  //Can be 'offline', 'online', 'connecting' or 'error'
  'onStatus': {type: "event", value: {
    "status": "string", //One of the above statuses
    "message": "string" //More detailed message about status
  }}
});

