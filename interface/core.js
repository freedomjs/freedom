fdom.apis.set("core.view", {
  'show': {type: "method", value: [{
    'file':"string",
    'code':"string",
    'hide':'bool'
  }]},
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
