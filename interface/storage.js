fdom.apis.set("storage", {
  //Returns an array of all keys
  //e.g. keys() => [string]
  //Returns an array with all keys in the store
  'keys': {type: "method", value: []},

  //Returns a value for a key, null if doesn't exist
  //e.g. get(String key) => string
  //Returns a string with the value
  'get': {type: "method", value: ["string"]},

  //Sets a value to a key
  //e.g. set(String key, String value)
  //Returns nothing
  'set': {type: "method", value: ["string", "string"]},
  
  //Removes a single key
  //e.g. remove(String key)
  //Returns nothing
  'remove': {type: "method", value: ["string"]},
  
  //Removes all data from storage
  //e.g. storage.clear();
  //Returns nothing
  'clear': {type: "method", value: []}

});
