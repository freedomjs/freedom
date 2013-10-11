var identity = freedom.identity();
var activeJid;
var roster = {};

freedom.on('send-message', function(val) {
  identity.sendMessage(val.to, val.message);
});

identity.on('onStatus', function(msg) {
  freedom.emit('onStatus', msg);
  if (msg.userId) {
    freedom.emit('recv-uid', msg.userId);
  }
});

identity.on('onMessage', function(data) {
  freedom.emit('recv-message', data.message);
});

identity.on('onChange', function(data) {
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
  identity.login({
    network: 'websockets',
    agent: 'chatdemo', 
    version: '0.1', 
    url: '',
    interactive: false
  });
};
setTimeout(onload,0);
//onload();


