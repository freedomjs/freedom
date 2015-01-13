/*jslint sloppy:true*/
/*globals freedom, console */
/**
 * Connections application logic.
 * Monitors the social API, to provide state information to the view about
 * currently connected peers, and observed interactions.
 **/

var social;
var view = freedom['core.view']();
var logger;
var users = {};    //Keep track of the roster
var myClientState = null;
var doLogin;

freedom.core().getLogger('Connection Controller').then(function (log) {
  logger = log;
});

/**
 * Relay messages from the social network to the view.
 */
function onMsg(data) {
  view.postMessage({
    event: 'message',
    message: data
  });
}

function sendUsers() {
  view.postMessage({
    event: 'user',
    users: users
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
  if (data.status === social.STATUS.OFFLINE) {
    if (users.hasOwnProperty(data.userId)) {
      delete users[data.userId];
    }
  } else {  //Only track non-offline clients
    users[data.userId] = data;
  }
  sendUsers();

  // Handle my state separately
  if (myClientState !== null && data.clientId === myClientState.clientId) {
    view.postMessage({
      event: 'status',
      online: data.status === social.STATUS.ONLINE
    });
    view.postMessage({'height': data.status === social.STATUS.ONLINE ? 384 : 109});
    if (data.status !== social.STATUS.ONLINE) {
      logger.error('got status ' + data.status + ' from social');
      doLogin();
    }
  }
}

/** LOGIN AT START **/
doLogin = function () {
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
  }).then(function (ret) {
    myClientState = ret;
    view.postMessage({
      event: 'status',
      online: ret.status === social.STATUS.ONLINE
    });
    view.postMessage({'height': ret.status === social.STATUS.ONLINE ? 384 : 109});
  }, function (err) {
    view.postMessage({
      event: 'status',
      online: err
    });
    view.postMessage({'height': 109});
  });
};
doLogin();

view.on('message', function (msg) {
  logger.log('main got msg ' + msg);
});

/** SHOW VIEW AT START **/
view.show('connections').then(function () {
  logger.log('View opened');
});
