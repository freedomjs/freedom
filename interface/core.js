fdom.apis.set("core", {
  'getReference': {type: "method", value: ["String"]}
});

fdom.apis.set("core.view", {
  'open': {type: "method", value: [{
    'file':"string",
    'code':"string"
  }]},
  'show': {type: "method", value: []},
  'close': {type: "method", value: []},
  'postMessage': {type: "method", value: ["object"]},

  'message': {type: "event", value: "object"},
  'onClose': {type: "event", value: []}
});

fdom.apis.set("core.storage", {
  'set': {type: "method", value: ["string", "string"]},
  'get': {type: "method", value: ["string"]},
  'change': {type: "event", value: ["string"]}
});

fdom.apis.set("core.peerconnection", {
  'open': {type: "method", value: ["proxy", "string"]},
  'postMessage': {type: "method", value: [{"text": "string", "binary": "blob"}]},
  'message': {type: "event", value: {"text": "object", "binary": "blob"}},

  'close': {type: "method", value: []},
  'onClose': {type: "event", value: []}
});
