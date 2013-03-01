var identity = freedom.identity();
var transport = freedom.transport();

freedom.on('send-message', function(val) {
  identity.send(val.to, val.msg);
});

identity.on('buddylist', function(list) {
  freedom.emit('recv-buddylist', list);
});

identity.on('message', function(data) {
  freedom.emit('recv-message', data);
});

setTimeout(function() {
  //Fetch UID
  var namepromise = identity.get();
  namepromise.done(function(data) {
    freedom.emit('recv-uid', data.name);
  });
}, 0);


