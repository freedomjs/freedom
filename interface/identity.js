fdom.apis.set("identity", {
  'name': {type: "property", value: "string"},
  'get': {type: "method", value: []},
  'send': {type: "method", value: ["string", "string"]},

  'buddylist': {type: "event", value: ["array", "string"]},
  'message': {type: "event", value: {"from": "string", "message": "object"}}
});
