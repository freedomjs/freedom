var identity = freedom.identity();
var activeJid;
var roster = {};

freedom.on('send-message', function(val) {
  identity.sendMessage(val.to, val.message);
});

identity.on('onStatus', function(msg) {
  freedom.emit('onStatus', msg);
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
  identity
    .login('chatdemo', '0.1', '')
    .done(function(data) {
      freedom.emit('recv-uid', data.userId);
    });
};
setTimeout(onload,0);
//onload();


