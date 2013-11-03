/**
 * 
 **/

var social = freedom.socialprovider();
var activeJid;
var roster = {};

freedom.on('send-message', function(val) {
  social.sendMessage(val.to, val.message);
});

social.on('onStatus', function(msg) {
  freedom.emit('onStatus', msg);
  if (msg.userId) {
    freedom.emit('recv-uid', msg.userId);
  }
});

social.on('onMessage', function(data) {
  freedom.emit('recv-message', data.message);
});

social.on('onChange', function(data) {
  console.log("!!!!" + JSON.stringify(data));
  roster[data.userId] = data;
  var buddylist = [];
  for (var k in roster) {
    if (roster.hasOwnProperty(k)) {
      buddylist.push(k);
    }
  }
  freedom.emit('recv-buddylist', buddylist);
});


var onload = function() {
  //Fetch UID
  social.login({
    network: 'websockets',
    agent: 'chatdemo', 
    version: '0.1', 
    url: '',
    interactive: false
  });
};
setTimeout(onload,0);
//onload();
