fdom.apis.set("transport", {
  // open is called to bind a freedom channel identifier (called a proxy) to act
  // as a signalling channel to setup a data connection. If the provided boolean
  // is true, then the open call will initiate the setup of the connection when
  // the transport setup is asynchronous.
  'open': {type: "method", value: ["proxy", "bool"]},

  // Send data down the channel with name specified by the string.
  'send': {type: "method", value: ["string", "data"]},

  // TODO: refactor, naming this onMessage.
  'message': {type: "event", value: "data"},
  'close': {type: "method", value: []},
  'onClose': {type: "event", value: []}
});
