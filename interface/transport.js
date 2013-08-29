fdom.apis.set("core.peerconnection", {
  'open': {type: "method", value: ["proxy"]},
  'postMessage': {type: "method", value: [{"tag": "string", "text": "string", "binary": "blob", "buffer": "buffer"}]},
  'message': {type: "event", value: {"tag": "string", "text": "string", "binary": "blob", "buffer": "buffer"}},

  'close': {type: "method", value: []},
  'onClose': {type: "event", value: []}
});

fdom.apis.set("transport", {
  'open': {type: "method", value: ["proxy"]},
  'send': {type: "method", value: ["string", "data"]},
  'message': {type: "event", value: "data"},
  'close': {type: "method", value: []},
  'onClose': {type: "event", value: []}
});