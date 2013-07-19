fdom.apis.set("identity", {
  //Stores the 'ID' for logged in user (alice@gmail.com)
  //e.g. var id = identity.id
  'id': {type: "property", value: "string"},
  //Gets the profile of a user
  //If id is null, return self
  //e.g. identity.getProfile(String id);
  //Returns {
  //  'card': {
  //    'id': 'string',       //ID (e.g. alice@gmail.com) username
  //    'name': 'string',     //Name (e.g. Alice Underpants)
  //    'imageUrl': 'string', //URL to profile pic
  //    'status': 'string'    //Status (['available', 'offline', 'away', 'idle'])
  //  }
  //  'roster': {             //List of friends
  //    'id1': {              //NOTE: Key must match 'id' in card
  //      'id1': 'string',
  //      'name': 'string',
  //      'imageUrl': 'string',
  //      'status': 'string'
  //    },
  //    'id2': ...
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
    'id': 'string',
    'name': 'string',
    'imageUrl': 'string',
    'status': 'string'
  }},
  //Event on incoming message
  'onMessage': {type: "event", value: {
    "from": "string",   //id of user message is from
    "message": "object" //message contents
  }}
});

