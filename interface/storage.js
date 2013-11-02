/**
 * STORAGE API
 *
 * API for Persistent Storage
 * Exposes a key-value get/put interface
 **/
fdom.apis.set("storage", {
  /**
   * Fetch an array of all keys
   * e.g. storage.keys() => [string]
   *
   * @method keys
   * @return an array with all keys in the store 
   **/ 
  'keys': {type: "method", value: []},

  /**
   * Fetch a value for a key
   * e.g. storage.get(String key) => string
   *
   * @method get
   * @param {String} key - key to fetch
   * @return {String} Returns a string with the value, null if doesn't exist
   **/
  'get': {type: "method", value: ["string"]},

  /**
   * Sets a value to a key
   * e.g. storage.set(String key, String value)
   *
   * @method set
   * @param {String} key - key of value to set
   * @param {String} value - value
   * @return nothing
   **/
  'set': {type: "method", value: ["string", "string"]},
  
  /**
   * Removes a single key
   * e.g. storage.remove(String key)
   *
   * @method remove
   * @param {String} key - key to remove
   * @return nothing
   **/
  'remove': {type: "method", value: ["string"]},
  
  /**
   * Removes all data from storage
   * e.g. storage.clear()
   *
   * @method clear
   * @return nothing
   **/
  'clear': {type: "method", value: []}

});
