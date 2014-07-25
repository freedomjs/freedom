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
var socialProviders = [ freedom.socialprovider() ];
var transportProviders = [ freedom.transport ];
var social = new SocialTransport(socialProviders, transportProviders);
var storage = freedom.storageprovider();

// Internal State
var myClientState = null;
var userList = {};
var clientList = {};
var files = {};         // Files served from this node
var queuedFetch = null;  // Store most recent fetch request

console.log('File Drop root module');

function updateStats(key, inprogress, done) {
  if (!files[key].stats.hasOwnProperty('inprogress')) {
    files[key].stats.inprogress = 0;
  }
  if (!files[key].stats.hasOwnProperty('done')) {
    files[key].stats.done = 0;
  }
  files[key].stats.key = key;
  files[key].stats.inprogress += inprogress;
  files[key].stats.done += done;
  freedom.emit('stats', files[key].stats);
}

freedom.on('serve-data', function(data) {
  if (!data.key || !data.value) {
    console.log('serve-data: malformed request ' + JSON.stringify(data));
    return;
  }
  console.log('serve-data: now serving ' + data.key);
  files[data.key] = {
    data: data.value,
    stats: {}
  };
  if (myClientState.status == social.STATUS["ONLINE"]) {
    freedom.emit('serve-descriptor', {
      targetId: myClientState.clientId,
      key: data.key,
      name: data.name
    });
  } else {
    freedom.emit('serve-error', "Error connecting to server.");
  }
  updateStats(data.key, 0, 0);
});

function fetch(data) {
  //@todo smarter way to choose a target in the future
  var serverId = data.targetId;
  var key = data.key;
  
  console.log("fetch: downloading " + key + " from " + serverId);
  //Tell 'em I'm comin' for them
  social.sendMessage(serverId, 'protocol', JSON.stringify({
    cmd: 'fetch',
    data: key
  })).then(function() {
  }, function(err) {
    console.error(JSON.stringify(err));
  });
}

freedom.on('download', function(data) {
  if (myClientState !== null && 
      myClientState.status == social.STATUS["ONLINE"]) {
    fetch(data);
  } else {
    queuedFetch = data;
  }
});

social.on('onUserProfile', function(data) {
  userList[data.userId] = data;
});

social.on('onClientState', function(data) {
  clientList[data.clientId] = data;
  if (myClientState !== null && 
      data.clientId == myClientState.clientId) {
    myClientState = data;
  }

  console.log('onClientState:' + JSON.stringify(data));

  if (data.status == social.STATUS["ONLINE"] && 
    queuedFetch !== null && data.clientId == queuedFetch.targetId) {
    fetch(queuedFetch);
    //setTimeout(fetch.bind({},queuedFetch),10000);
  }

});

social.on('onMessage', function(data) {
  var msg;
  var targetId;
  var key;

  if (data.tag == 'file') {
    console.log("Received data with tag: " + data.tag);
    social.sendMessage(data.from.clientId, 'protocol', JSON.stringify({
      cmd: 'done',
      data: queuedFetch.key 
    })).then(function() {
    }, function(err) {
      console.error(JSON.stringify(err));
    });
    freedom.emit('download-data', data.data);
    return;
  }

  // Try parsing message
  try {
    data.message = social._ab2str(data.data);
    msg = JSON.parse(data.message);
  } catch (e) {
    console.log("Error parsing message: " + data);
    return;
  }
  
  if (data.from.clientId && msg.cmd && msg.data && msg.cmd == 'fetch') {
    key = msg.data;
    targetId = data.from.clientId;
    updateStats(key, 1, 0);

    console.log("social.onMessage: Received request for " + key + " from " + targetId);
    if (files[key] && files[key].data) {
      console.log("social.onMessage: Sending " + key + " to " + targetId);
      social.sendMessage(targetId, 'file', files[key].data).then(function() {
      }, function(err) {
        console.error(JSON.stringify(err));
      });
    } else {
      console.log("social.onMessage: I don't have key: " + key);
      social.sendMessage(targetId, 'protocol', JSON.stringify({
        cmd: 'error',
        data: 'File missing!'
      })).then(function() {
      }, function(err) {
        console.error(JSON.stringify(err));
      });
    }
  } else if (data.from.clientId && msg.cmd && msg.data && msg.cmd == 'done') {
    key = msg.data;
    updateStats(key, -1, 1);
  } else if (data.from.clientId && msg.cmd && msg.data && msg.cmd == 'error') {
    console.log('social.onMessage: ' + msg.data);
    freedom.emit('download-error', msg.data);
  } else {
    console.log("social.onMessage: Unrecognized message: " + JSON.stringify(data));
  }
  
});

/** LOGIN AT START **/
console.log('Logging in to social API');
social.login({
  agent: 'filedrop', 
  version: '0.1', 
  url: '',
  interactive: true,
  rememberLogin: false
}).then(function(ret) {
  myClientState = ret;
  if (ret.status == social.STATUS["ONLINE"]) {
    console.log('social.login: ONLINE!');
  } else {
    console.log('social.login: ERROR!');
    freedom.emit("serve-error", "Failed logging in. Status: "+ret.status);
  }
}, function(err) {
  freedom.emit("serve-error", err.message); 
});

