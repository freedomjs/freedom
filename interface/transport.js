/**
 * TRANSPORT API
 *
 * API for peer-to-peer communication
 * Useful for sending large binary data between instances
 **/
fdom.apis.set("transport", {
  /**
   * Prepare a P2P connection with initialization parameters
   * Takes in a signalling pathway (freedom.js channel), which is used
   * by the transport provider to send/receive signalling messages
   * to the other side of the P2P connection for setup.
   *
   * @method setup
   * @param {string} name - give this connection a name for logging
   * @param {proxy} channel - signalling channel
   * @return {channel} - a channel which the calling module must use to
   *    forward signalling messages (e.g. through a the Social API)
   **/ 
  'setup': {type: "method", value: ["string", "proxy"]},

  /**
   * Send binary data to the peer
   * All data is labelled with a string tag
   * Any data sent with the same tag is sent in order,
   * but there is no guarantees between tags
   *
   * @method send
   * @param {string} tag
   * @param {buffer} data
   * @return nothing
   **/
  'send': {type: "method", value: ["string", "buffer"]},

  /**
   * Close the connection
   * 
   * @method close
   * @return nothing
   **/
  'close': {type: "method", value: []},

  /**
   * Event on incoming data (ArrayBuffer)
   **/
  'onData': {type: "event", value: {
    "tag": "string",
    "data": "buffer"
  }},

  /**
   * Event on successful closing of the connection
   **/
  'onClose': {type: "event", value: []}
});
