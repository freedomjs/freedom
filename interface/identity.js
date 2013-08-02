fdom.apis.set("identity", {
  //Stores the 'ID' for logged in user (alice@gmail.com)
  //e.g. var id = identity.id
  'id': {type: "property", value: "string"},
  //Log into the network
  //e.g. login(String agent, String version, String url)
  //Returns {
  //  'success': 'boolean',
  //  'message': 'string'
  //}
  'login': {type: "method", value: ["string", "string", "string"]},
  //Gets the profile of a user
  //If id is null, return self
  //e.g. identity.getProfile(String id);
  //Returns {
  //  'card': {
  //    'userId': 'string',       //ID (e.g. alice@gmail.com) username
  //    'name': 'string',         //Name (e.g. Alice Underpants)
  //    'imageUrl': 'string',     //URL to profile pic
  //    'url': 'string',          //Homepage URL
  //    'devices': [{              //Array of devices
  //      'deviceId': 'string',   //ID of device (e.g. alice@gmail.com/Android-23nadsv32f)
  //      'status': 'string'      //Status (['messageable', 'online', 'offline'])
  //    }, ...]
  //  },
  //  'roster': {                 //List of friends
  //    'user1': {                //NOTE: Key must match 'userId' in card
  //      'userId': 'string',
  //      'name': 'string',
  //      'imageUrl': 'string',
  //      'url': string,
  //      'devices': [
  //        'deviceId': 'string',
  //        'status': 'string'
  //      ]
  //    },
  //    'user2': ...
  //  }
  //}
  'getProfile': {type: "method", value: ["string"]},
  //Send a message to user on your network
  //e.g. sendMessage(String destination_id, String message)
  //Returns nothing
  'sendMessage': {type: "method", value: ["string", "string"]},
  //Event on change in profile
  //(includes changes to roster)
  'onChange': {type: "event", value: {
    'userId': 'string',
    'name': 'string',
    'imageUrl': 'string',
    'url': 'string',
    'devices': ['array', 'object']
  }},
  //Event on incoming message
  'onMessage': {type: "event", value: {
    "from": "string",   //id of user message is from
    "to": "string",     //id of user message is to
    "message": "object" //message contents
  }}
});

