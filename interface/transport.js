fdom.apis.set("core.peerconnection", {
  'open': {type: "method", value: ["proxy"]},
  'postMessage': {type: "method", value: [{"tag": "string", "text": "string", "binary": "blob", "buffer": "buffer"}]},
  'message': {type: "event", value: {"tag": "string", "text": "string", "binary": "blob", "buffer": "buffer"}},

  'close': {type: "method", value: []},
  'onClose': {type: "event", value: []}
});

fdom.apis.set("core.sctp-peerconnection", {
  //
  'open': {type: "method",
    // The proxy object to send/receive messages from a signalling chanel
    value: ["proxy"]
  },
  //
  'postMessage': {type: "method", value: [{
    // Data channel id, required.
    "channelid": "string",
    // One of the bellow should be defined; this is the data to send.
    "text": "string",
    "binary": "blob",
    "buffer": "buffer"
  }]},

  'message': {type: "event", value: {
    "channelid": "string",
    "text": "string",
    "binary": "blob",
    "buffer": "buffer"
  }},

  'close': {type: "method", value: []},
  'onClose': {type: "event", value: []}
});

fdom.apis.set("transport", {
  'open': {type: "method", value: ["proxy"]},
  'send': {type: "method", value: ["string", "data"]},
  // TODO: refactor, naming this onMessage.
  'message': {type: "event", value: "data"},
  'close': {type: "method", value: []},
  'onClose': {type: "event", value: []}
});
