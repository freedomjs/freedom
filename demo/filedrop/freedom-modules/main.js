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
var socialProviders = [ freedom.socialprovider ];
var transportProviders = [ freedom.transport ];
var social = new SocialTransport(socialProviders, transportProviders);
var storage = freedom.storageprovider();

// Actors
var fileServer = new FileServer(social);
var fileFetcher = new FileFetcher(social);

// Internal State
var myClientState = null;
var userList = {};
var clientList = {};

console.log('File Drop root module');

freedom.on('serve-data', function(data) {
  fileServer.serve(myClientState, data.key, data.value, data.name);
});

freedom.on('download', function(downloadDesc) {
  fileFetcher.download(downloadDesc);
});

social.on('onUserProfile', function(val) {
  userList[val.userId] = val;
});

social.on('onClientState', function(data) {
  console.log('onClientState:' + JSON.stringify(data));
  clientList[data.clientId] = data;
  if (myClientState !== null && 
      data.clientId == myClientState.clientId) {
    myClientState = data;
  }
  fileFetcher.onClientState(data);
});

social.on('onMessage', function(val) {
  if (val.tag == 'f2s') {
    fileServer.onMessage(val);
  } else {
    fileFetcher.onMessage(val);
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

