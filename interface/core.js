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
  'setup': {type: "method", value: [{
    "debugId": "string"
  }]},

  // Open a peer connection via the freedom signalling channel (used to speak
  // to the peer).
  'startup': {type: "method",
    // The 'proxy' object is a freedom channel identifier used to send/receive
    // messages to/from a signalling chanel. TODO: The string is meant to be a
    // boolean, but Freedom doesn't support it yet.
    value: ["proxy", "string"]
  },

  // Send a message to the peer.
  'postMessage': {type: "method", value: [{
    // Data channel id. If provided, will be used as the channel label.
    // If the channel label doesn't already exist, a new channel will be
    // created.
    "channelid": "string",
    // One of the bellow should be defined; this is the data to send.
    "text": "string",
    "binary": "blob",
    "buffer": "buffer"
  }]},

  // Called when we get a message from the peer.
  'onMessage': {type: "event", value: [{
    // The label/id of the data channel.
    "channelid": "string",
    // One the below will be specified.
    "text": "string",
    "binary": "blob",
    "buffer": "buffer"
  }]},

  // Close a data channel. The argument is the channel label/id.
  'closeDataChannel': {type: "method", value: ["string"]},

  // Close the peer connection.
  'shutdown': {type: "method", value: []},

  // onClose is called when the peer closes a data channel connection.
  'onClose': {type: "event", value: [{"channelid": "string"}]}
});

