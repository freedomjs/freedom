/**
 * Connections application logic.
 * Monitors the social API, to provide state information to the view about
 * currently connected peers, and observed interactions.
 **/

var social;
var view = freedom['core.view']();
var users = {};    //Keep track of the roster
var myClientState = null;

/**
 * Relay messages from the social network to the view.
 */
function onMsg(data) {
  view.postMessage({
    event: 'message',
    message: data
  });
}

/**
 * On user profile changes, let's keep track of them
 **/
function onProfile(data) {
  //Just save it for now
  users[data.userId] = data;
  sendUsers();
}

/**
 * On newly online or offline clients, let's update the roster
 **/
function onState(data) {
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
    freedom.emit('height', data.status == social.STATUS["ONLINE"] ? 384 : 109);
    if (data.status != social.STATUS["ONLINE"]) {
      console.error('got status ' + data.status + ' from social');
      doLogin();
    }
  }
}

view.on('message', function(msg) {
});

function sendUsers() {
  view.postMessage({
    event: 'user',
    users: users
  });
}

/** LOGIN AT START **/
var doLogin = function() {
  var s = freedom.socialprovider();
  if (social) {
    freedom.socialprovider.close(social);
  }
  social = s;

  social.on('onMessage', onMsg);
  social.on('onUserProfile', onProfile);
  social.on('onClientState', onState);
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
    freedom.emit('height', ret.status == social.STATUS["ONLINE"] ? 384 : 109);
  }, function(err) {
    view.postMessage({
      event: 'status',
      online: err
    });
    freedom.emit('height', 109);
  });
};
doLogin();

/** SHOW VIEW AT START **/
view.open('connections', {file: 'view.html'}).then(function() {
  view.show();
});
