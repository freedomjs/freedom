fdom.apis.set("core.transport", {
  'create': {type: "method", value: []},
  'accept': {type: "method", value: ["number", "object"]},
  'send': {type: "method", value: {
    "header": "object",
    "data": "blob"
  }},
  'close': {type: "method", value: ["number"]},
  
  'onStateChange': {type: "event", value: "object"},
  'onMessage': {type: "event", value: {
    "header": "object",
    "data": "blob"
  }},
  'onSignal': {type: "event", value: "object"}
});
