/**
 * TRANSPORT API
 *
 * API for peer-to-peer communication
 * Useful for sending large binary data between instances
 **/
fdom.apis.set("transport", {
  /**
  * open is called to bind a freedom channel identifier (called a proxy) to act
  * as a signalling channel to setup a data connection. If the provided boolean
  * is true, then the open call will initiate the setup of the connection when
  *
  * @method setup
  * @param {proxy} channel - signalling channel
  * @param {bool} init - true if initiates connection
  * @return nothing
  **/ 
  'setup': {type: "method", value: ["proxy", "bool"]},

  // Send data down the channel with name specified by the string.
  'send': {type: "method", value: ["string", "buffer"]},

  // TODO: refactor, naming this onMessage.
  'onData': {type: "event", value: "buffer"},

  'close': {type: "method", value: []},

  'onClose': {type: "event", value: []}
});
