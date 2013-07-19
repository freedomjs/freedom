fdom.apis.set("storage", {
  //Removes all data from storage
  //e.g. storage.clear();
  //Returns nothing
  'clear': {type: "method", value: []},
  //Sets a value to a key
  //e.g. set(String key, String value)
  //Returns nothing
  'set': {type: "method", value: ["string", "string"]},
  //Removes a single key
  //e.g. remove(String key)
  //Returns nothing
  'remove': {type: "method", value: ["string"]},
  //Returns a value for a key, null if doesn't exist
  //e.g. get(String key)
  //Returns a string with the value
  'get': {type: "method", value: ["string"]}
});
