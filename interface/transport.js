fdom.apis.set("transport", {
  // open is called to bind a freedom channel identifier (called a proxy) to act
  // as a signalling channel to setup a P2P connection. If the provided boolean
  // is true, then the open call will initiate the setup of a P2P connection to
  // the peer at the other end of the freedom channel specified by the proxy
  // identifier.
  'open': {type: "method", value: ["proxy", "bool"]},

  // Send data down the channel with name specified by the string.
  'send': {type: "method", value: ["string", "data"]},

  // TODO: refactor, naming this onMessage.
  'message': {type: "event", value: "data"},
  'close': {type: "method", value: []},
  'onClose': {type: "event", value: []}
});
