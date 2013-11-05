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
var social = freedom.socialprovider();
var networks = {};
var roster = {};
var userId = null;
console.log('File Drop root module');

freedom.on('serve-data', function(data) {
  file = data;
  var key = Math.random() + "";
  files[key] = data;
  if (userId) {
    freedom.emit('serve-url', {
      userId: userId,
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

freedom.on('download', function(data) {
  window.current = data;
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
  if (msg.userId) {
    userId = msg.userId;
  }
  networks[msg.network] = msg;
});

social.on('onChange', function(data) {
  roster[data.userId] = data
});

social.on('onMessage', function(data) {

});
