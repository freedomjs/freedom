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
// FreeDOM APIs
var core = freedom.core();
var social = freedom.socialprovider();
var storage = freedom.storageprovider();

// Internal State
var networks = {};
var userList = {};
var clientList = {};
var files = {};       // Files served from this node
var fetchQueue = [];  // Files on queue to be downloaded

// PC
var connections = {};
var signallingChannels = {};

console.log('File Drop root module');

function getMyClientIds() {
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
  if (!data.key || !data.value) {
    console.log('serve-data: malformed request ' + JSON.stringify(data));
    return;
  }

  console.log('serve-data: now serving ' + data.key);
  files[data.key] = data.value;
  var clientIds = getMyClientIds();
  if (clientIds.length > 0) {
    freedom.emit('serve-descriptor', {
      targetId: clientIds,
      key: data.key,
      name: data.name    
    });
    // DEBUG - remove later
    freedom.emit('stats', {
      key: data.key,
      inprogress: 1,
      done: 10
    });
    //
  } else {
    freedom.emit('serve-error', "Error connecting to server.");
  }
});

function setupConnection(name, targetId) {
  connections[targetId] = freedom.transport();
  connections[targetId].on('onData', function(message) {
    console.log("Receiving data with tag: " + message.tag);
    freedom.emit('download-data', message.data);
  });
  return core.createChannel().then(function (chan) {
    // Set up the signalling channel first, it may be needed in the
    // peerconnection setup.
    chan.channel.on('message', function(msg) {
      social.sendMessage(targetId, JSON.stringify({
        cmd: 'signal',
        data: msg
      }));
    });
    signallingChannels[targetId] = chan.channel;
    return connections[targetId].setup(name, chan.identifier);
  });
}

// Am I online some Social network right now?
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
  
  console.log("fetch: downloading " + key + " from " + serverId);
  //Tell 'em I'm comin' for them
  social.sendMessage(serverId, JSON.stringify({
    cmd: 'fetch',
    data: key
  }));
  setupConnection("fetcher", serverId);
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
    console.log('Logging into ' + msg.network);
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
    console.log('social.onStatus: ONLINE!');
    while (fetchQueue.length > 0) {
      fetch(fetchQueue.shift());
    }
  }
});

social.on('onUserProfile', function(data) {
  userList[data.userId] = data;
});

social.on('onClientList', function(data) {
  clientList[data.clientId] = data;
});

social.on('onMessage', function(data) {
  var msg;
  var targetId;
  var key;

  // Try parsing message
  try {
    msg = JSON.parse(data.message);
  } catch (e) {
    console.log("Error parsing message: " + data);
    return;
  }
  
  if (data.fromClientId && msg.cmd && msg.data && msg.cmd == 'fetch') {
    key = msg.data;
    targetId = data.fromClientId;

    console.log("social.onMessage: Received request for " + key + " from " + targetId);
    setupConnection("server-"+targetId, targetId).then(function(){ //SEND IT
      if (files[key]) {
        console.log("social.onMessage: Sending " + key + " to " + targetId);
        connections[targetId].send('filedrop', files[key]);
      } else {
        console.log("social.onMessage: I don't have key: " + key);
        social.sendMessage(targetId, JSON.stringify({
          cmd: 'error',
          data: 'File missing!'
        }));
      }
    });
  } else if (data.fromClientId && msg.cmd && msg.data && msg.cmd == 'error') {
    console.log('social.onMessage: ' + msg.data);
    freedom.emit('download-error', msg.data);
  } else if (data.fromClientId && msg.cmd && msg.data && msg.cmd == 'signal') {
    console.log('social.onMessage: signalling message');
    targetId = data.fromClientId;
    if (signallingChannels[targetId]) {
      signallingChannels[targetId].emit('message', msg.data);
    } else {
      //DEBUG
      console.error("Signalling channel missing!!");
    }
  } else {
    console.log("social.onMessage: Unrecognized message: " + JSON.stringify(data));
  }
  
});
