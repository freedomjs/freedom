fdom.apis.set("transport", {
  // open is called to bind a freedom channel identifier (called a proxy) so
  // that a P2P connection can be setup.
  'open': {type: "method", value: ["proxy"]},

  // Send data down the channel with name specified by the string.
  'send': {type: "method", value: ["string", "data"]},

  // TODO: refactor, naming this onMessage.
  'message': {type: "event", value: "data"},
  'close': {type: "method", value: []},
  'onClose': {type: "event", value: []}
});
