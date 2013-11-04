/**
 * Chat demo backend.
 * Because the Social API provides message passing primitives,
 * this backend simply forwards messages between the front-end and our Social provider
 * Note that you should be able to plug-and-play a variety of social providers
 * and still have a working demo
 *
 **/

var social = freedom.socialprovider();
var roster = {};    //Keep track of the roster
var networks = {};

/** 
 * on a 'send-message' event from the parent (the outer page)
 * Just forward it to the Social provider
 **/
freedom.on('send-message', function(val) {
  social.sendMessage(val.to, val.message);
});

/**
 * on a 'onStatus' from the Social provider
 * Just forward it to the outer page
 * If we see our userId, send that as a separate event
 **/
social.on('onStatus', function(msg) {
  //If never seen this network before, try logging in
  if (!networks.hasOwnProperty(msg.network)) {
    social.login({
      network: msg.network,
      agent: 'chatdemo', 
      version: '0.1', 
      url: '',
      interactive: true 
    });
  }
  networks[msg.network] = msg;

  if (msg.userId) {
    freedom.emit('recv-uid', msg.userId);
  }
  if (msg.status == social.STATUS_NETWORK["ONLINE"]) {
    freedom.emit('recv-status', 'online');
  } else {
    freedom.emit('recv-status', msg.message);
  }

});

/**
 * on an 'onMessage' event from the Social provider
 * Just forward it to the outer page
 */
social.on('onMessage', function(data) {
  freedom.emit('recv-message', data);
});

/**
 * On roster changes, let's keep track of them
 **/
social.on('onChange', function(data) {
  roster[data.userId] = data;
  // Iterate over our roster and just send over userId's where there is at least 1 client online
  var buddylist = [];
  for (var k in roster) {
    if (roster.hasOwnProperty(k) && hasOnlineClient(roster[k])) {
      buddylist.push(k);
    }
  }
  freedom.emit('recv-buddylist', buddylist);
});


/**
 * Iterate over a <user card> (see interface/social.js for schema)
 * and check for a client that's online
 * 
 * @method hasOnlineClient
 * @param {Object} data - <user card>
 * @return {Boolean} - true if there's at least 1 online client 
 **/
function hasOnlineClient(data) {
  if (data.clients) {
    for (var k in data.clients) {
      if (data.clients.hasOwnProperty(k) && 
          data.clients[k].status &&
          data.clients[k].status !== social.STATUS_CLIENT['OFFLINE']) {
        return true;
      }
    }
  }
  return false;
}

