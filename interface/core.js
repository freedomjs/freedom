/*globals fdom:true */
/*jslint indent:2,sloppy:true */

fdom.apis.set("core", {
  'createChannel': {type: "method", value: [], ret: {
    channel: "proxy",
    identifier: "string"
  }},
  'bindChannel': {type: "method", value: ["string"], ret: "proxy"},
  'getId': {type: "method", value: [], ret: ["array", "string"]}
});

fdom.apis.set("core.view", {
  'open': {type: "method", value: ["string", {
    'file': "string",
    'code': "string"
  }]},
  'show': {type: "method", value: []},
  'close': {type: "method", value: []},
  'postMessage': {type: "method", value: ["object"]},

  'message': {type: "event", value: "object"},
  'onClose': {type: "event", value: []}
});

fdom.apis.set("core.storage", {
  'keys': {type: "method", value: [], ret: ["array", "string"]},
  'get': {type: "method", value: ["string"], ret: "string"},
  'set': {type: "method", value: ["string", "string"], ret: "string"},
  'remove': {type: "method", value: ["string"], ret: "string"},
  'clear': {type: "method", value: []}
});

// A TCP Socket.
fdom.apis.set("core.tcpsocket", {
  // Sockets may be constructed bound to a pre-existing id, as in the case of
  // interacting with a socket accpeted by a server.  If no Id is specified, a
  // new socket will be created, which can be either connect'ed or listen'ed.
  'constructor': {
    value: ["number"]
  },

  // Get info about a socket.  Tells you whether the socket is active and
  // available host information.
  'getInfo': {
    type: "method",
    value: [],
    ret: {
      "connected": "boolean",
      "localAddress": "string",
      "localPort": "number",
      "peerAddress": "string",
      "peerPort": "number"
    }
  },

  // Close a socket. Will Fail if the socket is not connected or already
  // closed.
  'close': {
    type: "method",
    value: [],
    err: {
      "errcode": "string",
      "message": "string"
    }
  },

  // Receive notification that the socket has disconnected.
  'onDisconnect': {type: "event", value: {
    "errcode": "string",
    "message": "string"
  }},
  
  // Connect to a host and port.
  // Fails with an error if connection fails.
  'connect': {
    type: "method",
    value: ["string", "number"],
    err: {
      "errcode": "string",
      "message": "string"
    }
  },
  
  // Write buffer data to a socket.
  // Fails with an error if write fails.
  'write': {
    type: "method",
    value: ["buffer"],
    err: {
      "errcode": "string",
      "message": "string"
    }
  },

  // Receive data on a connected socket.
  'onData': {
    type: "event",
    value: {"data": "buffer"}
  },

  // Listen as a server at a specified host and port.
  // After calling listen the client should listen for 'onConnection' events.
  // Fails with an error if errors occur while binding or listening.
  'listen': {
    type: "method",
    value: ["string", "number"],
    err: {
      "errcode": "string",
      "message": "string"
    }
  },

  // Receive a connection.
  // The socket parameter may be used to construct a new socket.
  // Host and port information provide information about the remote peer.
  'onConnection': {type: "event", value: {
    "socket": "number",
    "host": "string",
    "port": "number"
  }}
});

// A UDP socket.
// Generally, to use you just need to call bind() at which point onData
// events will start to flow. Note that bind() should only be called
// once per instance.
fdom.apis.set('core.udpsocket', {
  // Creates a socket, binds it to an interface and port and listens for
  // messages, dispatching each message as on onData event.
  // Returns an integer, with zero meaning success and any other value
  // being implementation-dependant.
  'bind': {
    type: 'method',
    value: [
      // Interface (address) on which to bind.
      'string',
      // Port on which to bind.
      'number'
    ],
    ret: 'number'
  },

  // Retrieves the state of the socket.
  // Returns an object with the following properties:
  //  - localAddress: the socket's local address, if bound
  //  - localPort: the socket's local port, if bound
  'getInfo': {type: 'method', value: [], ret: {
    'localAddress': 'string',
    'localPort': 'number'
  }},

  // Sends data to a server.
  // The socket must be bound.
  // Returns an integer indicating the number of bytes written, with no
  // guarantee that the remote side received the data.
  'sendTo': {
    type: 'method',
    value: [
      // Data to send.
      'buffer',
      // Destination address.
      'string',
      // Destination port.
      'number'
    ],
    ret: 'number'
  },

  // Releases all resources associated with this socket.
  // No-op if the socket is not bound.
  'destroy': {type: 'method', value: []},

  // Called once for each message received on this socket, once it's
  // been successfully bound.
  'onData': {
    type: 'event',
    value: {
      // Zero means success, any other value is implementation-dependent.
      'resultCode': 'number',
      // Address from which data was received.
      'address': 'string',
      // Port from which data was received.
      'port': 'number',
      // Data received.
      'data': 'buffer'
    }
  }
});

fdom.apis.set("core.runtime", {
  'createApp': {type: "method", value: ["string", "proxy"]},
  'resolve': {type: "method", value: ["string", "string"]},
  'needFile': {type: 'event', value: ["string", "string"]}
});

fdom.apis.set('core.echo', {
  'setup': {type: "method", value: ["string"]},
  'send': {type: "method", value: ["string"]},
  'message': {type: "event", value: "string"}
});


fdom.apis.set('core.peerconnection', {
  // Setup the link to the peer and options for this peer connection.
  'setup': {
    type: "method",
    value: [
      // The freedom.js channel identifier used to setup a signalling chanel.
      "string",
      // The peerName, used debugging and console messages.
      "string",
      // The list of STUN servers to use.
      // The format of a single entry is stun:HOST:PORT, where HOST
      // and PORT are a stun server hostname and port, respectively.
      ["array", "string"]
    ]
  },

  // Send a message to the peer.
  'send': {type: "method", value: [{
    // Data channel id. If provided, will be used as the channel label.
    // The behavior is undefined if the channel label doesn't exist.
    "channelLabel": "string",
    // One of the bellow should be defined; this is the data to send.
    "text": "string",
    "binary": "blob",
    "buffer": "buffer"
  }]},

  // Called when we get a message from the peer.
  'onReceived': {type: "event", value: {
    // The label/id of the data channel.
    "channelLabel": "string",
    // One the below will be specified.
    "text": "string",
    "binary": "blob",
    "buffer": "buffer"
  }},

  // Open the data channel with this label.
  'openDataChannel': {type: "method", value: ["string"]},
  // Close the data channel with this label.
  'closeDataChannel': {type: "method", value: ["string"]},

  // A channel with this id has been opened.
  'onOpenDataChannel': {type: "event", value: {"channelId": "string"}},
  // The channale with this id has been closed.
  'onCloseDataChannel': {type: "event", value: {"channelId": "string"}},

  // Returns the number of bytes that have queued using "send", but not
  // yet sent out. Currently just exposes:
  // http://www.w3.org/TR/webrtc/#widl-RTCDataChannel-bufferedAmount
  "getBufferedAmount": {type: "method",
                        value: ["string"],
                        ret: "number"},

  // Close the peer connection.
  'close': {type: "method", value: []},
  // The peer connection has been closed.
  'onClose': {type: "event", value: {}}
});

fdom.apis.set("core.websocket", {
  'constructor': {value: 
    // URL to connect through
    ["string",
    // Protocols
    ["array", "string"]]},
  'open': {type: "method",
    value: [],
    err: {
      "errcode": "string",
      "message": "string"
    }},
  // Send the data to the other side of this connection. Only one of
  // the entries in the dictionary that is passed will be sent.
  'send': {type: "method",
    value: [{
      "text": "string",
      "binary": "blob",
      "buffer": "buffer"
    }],
    err:{
      "errcode": "string",
      "message": "string"
    }},
    'getReadyState': {type: "method", 
      value: [],
      // 0 -> CONNECTING
      // 1 -> OPEN
      // 2 -> CLOSING
      // 3 -> CLOSED
      ret: "number"
     },
  'close': {type: "method",
    value: []},
  'onMessage': { type: 'event',
     // The data will be stored in one of the keys,
     // corresponding with the type received
     value: [{
       "text": "string",
       "binary": "blob",
       "buffer": "buffer"
     }]
   },
  'onOpen': { type: 'event',
     value: []
   },
  'onError': { type: 'event',
     value: [{
       "errcode": "string",
       "message": "string"
     }]
  },
  'onClose': { type: 'event',
     value: []
  }
});
