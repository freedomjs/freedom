/**
 * Connections application logic.
 * Monitors the social API, to provide state information to the view about
 * currently connected peers, and observed interactions.
 **/

var social = freedom.socialprovider();
var view = freedom['core.view']();
var users = {};    //Keep track of the roster
var myClientState = null;

/**
 * Relay messages from the social network to the view.
 */
social.on('onMessage', function(data) {
  view.postMessage({
    event: 'message',
    message: data
  });
});

/**
 * On user profile changes, let's keep track of them
 **/
social.on('onUserProfile', function(data) {
  //Just save it for now
  users[data.userId] = data;
  sendUsers();
});

/**
 * On newly online or offline clients, let's update the roster
 **/
social.on('onClientState', function(data) {
  if (data.status == social.STATUS["OFFLINE"]) {
    if (users.hasOwnProperty(data.userId)) {
      delete users[data.userId];
    }
  } else {  //Only track non-offline clients
    users[data.userId] = data;
  }
  sendUsers();

  // Handle my state separately
  if (myClientState !== null && data.clientId == myClientState.clientId) {
    view.postMessage({
      event: 'status',
      online: data.status == social.STATUS["ONLINE"]
    });
  }
});

view.on('message', function(msg) {
});

function sendUsers() {
  view.postMessage({
    event: 'user',
    users: users
  });
}

/** LOGIN AT START **/
social.login({
  agent: 'connections',
  version: '0.1',
  url: '',
  interactive: true,
  rememberLogin: false
}).then(function(ret) {
  myClientState = ret;
  view.postMessage({
    event: 'status',
    online: ret.status == social.STATUS["ONLINE"]
  });
}, function(err) {
  view.postMessage({
    event: 'status',
    online: err
  });
});

/** SHOW VIEW AT START **/
view.open('connections', {file: 'view.html'}).then(function() {
  view.show();
});
