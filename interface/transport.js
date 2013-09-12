fdom.apis.set("transport", {
  'open': {type: "method", value: ["proxy"]},
  'send': {type: "method", value: ["string", "data"]},
  // TODO: refactor, naming this onMessage.
  'message': {type: "event", value: "data"},
  'close': {type: "method", value: []},
  'onClose': {type: "event", value: []}
});
