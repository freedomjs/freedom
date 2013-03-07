fdom.apis.set("core.transport", {
  'create': {type: "method", value: []},
  'accept': {type: "method", value: ["number", "object"]},
  'send': {type: "method", value: ["number", "object"]},
  'close': {type: "method", value: ["number"]},
  
  'onStateChange': {type: "event", value: ["string"]},
  'onMessage': {type: "event", value: ["object"]},
  'onSignal': {type: "event", value: ["object"]}
});
