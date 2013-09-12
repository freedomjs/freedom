fdom.apis.set("core", {
  'createChannel': {type: "method", value: []},
  'bindChannel': {type: "method", value: ["proxy"]}
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

fdom.apis.set("core.socket", {
  'create': {type: "method", value: ["string", "object"]},
  'connect': {type: "method", value: ["number", "string", "number"]},
  'onData': {type: "event", value: {"socketId": "number", "data": "buffer"}},
  'write': {type: "method", value: ["number", "buffer"]},
  'disconnect': {type: "method", value: ["number"]},
  'destroy': {type: "method", value: ["number"]},
  'listen': {type: "method", value: ["number", "string", "number"]},
  'onConnection': {type: "event", value: {
    "serverSocketId": "number",
    "clientSocketId": "number"}},
  'getInfo': {type: "method", value: ["number"]}
});

fdom.apis.set("core.runtime", {
  'createApp': {type: "method", value: ["string", "proxy"]},
});

fdom.apis.set("core.peerconnection", {
  'open': {type: "method", value: ["proxy"]},
  'postMessage': {type: "method", value: [{"tag": "string", "text": "string", "binary": "blob", "buffer": "buffer"}]},
  'message': {type: "event", value: {"tag": "string", "text": "string", "binary": "blob", "buffer": "buffer"}},

  'close': {type: "method", value: []},
  'onClose': {type: "event", value: []}
});

fdom.apis.set('core.sctp-peerconnection', {
  // Open a new peer-connection.
  'open': {type: "method",
    // The proxy object to send/receive messages from a signalling chanel
    value: ["proxy"]
  },

  // Send a message to the peer.
  'postMessage': {type: "method", value: [{
    // Data channel id, required.
    "channelid": "string",
    // One of the bellow should be defined; this is the data to send.
    "text": "string",
    "binary": "blob",
    "buffer": "buffer"
  }]},

  // TODO: refactor to onMessage
  // Event when we get a message from a peer.
  'message': {type: "event", value: {
    "channelid": "string",
    "text": "string",
    "binary": "blob",
    "buffer": "buffer"
  }},

  // Close the conection.
  'close': {type: "method", value: []},

  // onClose is called when the peer closes the connection.
  'onClose': {type: "event", value: []}
});
