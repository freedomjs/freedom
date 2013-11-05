/**
 * This is the root module of our FreeDOM backend.
 * It runs in an isolated thread with its own namespace.
 * The root module has a special object 'freedom', which
 * is used as a message-passing channel to its parent (the outer webpage)
 **/
var window;
if (!window) {
  window = {};
}
var n = 0;
var files = {};
var core = freedom.core();
var social = freedom.socialprovider();
var storage = freedom.storageprovider();
var networks = {};
var roster = {};
var fetchQueue = [];

// PC
var connections = {};
var signallingChannels = {};
var messageQueues = {};

console.log('File Drop root module');

function getClientIds() {
  var result = [];
  for (var k in networks) {
    if (networks.hasOwnProperty(k) && networks[k].clientId && 
        networks[k].status && networks[k].status == social.STATUS_NETWORK['ONLINE']) {
      result.push(networks[k].clientId);
    }
  }
  return result;
}

freedom.on('serve-data', function(data) {
  file = data;
  var key = Math.random() + "";
  files[key] = data;
  var clientIds = getClientIds();
  if (clientIds.length > 0) {
    freedom.emit('serve-url', {
      targetId: clientIds,
      key: key
    });
    // DEBUG - remove later
    freedom.emit('stats', {
      key: key,
      inprogress: 1,
      done: 10
    });
    //
  } else {
    freedom.emit('serve-error', "Error connecting to server.");
  }
});

function setupConnection(targetId) {
  connections[targetId] = freedom['core.sctp-peerconnection']();
  connections[targetId].on('onReceived', function(message) {
    if (message.buffer) {
      freedom.emit('download-error', "Got some datas");
    } else if (message.text) {
      freedom.emit('download-error', message.text);
    } else {
      freedom.emit('download-error', "Received unrecognized data");
    }
  });
  connections[targetId].on('onCloseDataChannel', function(channelLabel) {
    if (connections[targetId]) {
      connections[targetId].closeDataChannel(channelLabel);
    }
  });
  core.createChannel().done(function (chan) {
    connections[targetId].setup(chan.identifier, "downloader-pc");
    chan.channel.done(function(signallingChannel) {
      signallingChannel.on('message', function(msg) {
        social.sendMessage(targetId, JSON.stringify({
          cmd: 'signal',
          data: msg
        }));
      });
      signallingChannel.on('ready', function() {
        signallingChannels[targetId] = signallingChannel;
        if (messageQueues[targetId]) {
          while(messageQueues[targetId].length > 0) {
            signallingChannel.emit('message', messageQueues[targetId].shift());
          }
        }
      });
    });
  });
}

function isOnline() {
  for (var k in networks) {
    if (networks.hasOwnProperty(k) && networks[k].status && networks[k].status == social.STATUS_NETWORK['ONLINE']) {
      return true;
    }
  }
  return false;
} 

function fetch(data) {
  //@todo smarter way to choose a target in the future
  var serverId = data.targetId[0];
  var key = data.key;
  //Tell 'em I'm comin' for them
  social.sendMessage(serverId, JSON.stringify({
    cmd: 'fetch',
    data: key
  }));
  setupConnection(serverId);
}

freedom.on('download', function(data) {
  if (isOnline()) {
    fetch(data);
  } else {
    fetchQueue.push(data);
  }
});

social.on('onStatus', function(msg) {
  if (!networks.hasOwnProperty(msg.network)) {
    social.login({
      network: msg.network,
      agent: 'filedrop', 
      version: '0.1', 
      url: '',
      interactive: true 
    });
  }
  networks[msg.network] = msg;
  if (msg.status && msg.status == social.STATUS_NETWORK['ONLINE']) {
    while (fetchQueue.length > 0) {
      fetch(fetchQueue.shift());
    }
  }
});

social.on('onChange', function(data) {
  roster[data.userId] = data;
});

social.on('onMessage', function(data) {
  var msg;
  try {
    msg = JSON.parse(data.message);
  } catch (e) {
    console.log("Error parsing message: " + data);
    return;
  }
  console.log(msg);
  if (data.fromClientId && msg.cmd && msg.cmd == 'fetch') {
    var key = msg.data;
    //SEND IT
    setupConnection(data.fromClientId);
  } else {
    console.log("Unrecognized message: " + data);
  }
  
});
