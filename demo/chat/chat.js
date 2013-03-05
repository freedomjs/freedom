var identity = freedom.identity();
var transport = freedom['core.transport']();
var sockId = -1;

freedom.on('send-message', function(val) {
  identity.send(val.to, val.msg);
  /**
  if (sockId == -1) {
    var promise = transport.create();
    promise.done(function (data) {
      sockId = data.id;
      console.log('Created PeerConnection: '+sockId);
      //identity.send(val.to, data.offer);
    });
  }
  **/
});

identity.on('buddylist', function(list) {
  freedom.emit('recv-buddylist', list);
});

identity.on('message', function(data) {
  freedom.emit('recv-message', data.message);
});

transport.on('onStateChange', function(data) {
  console.log('State change for id='+data.id+' to '+data.state);
});

transport.on('onMessage', function(data) {
  freedom.emit('recv-message', data.id+': '+data.message);
});

setTimeout(function() {
  //Fetch UID
  var namepromise = identity.get();
  namepromise.done(function(data) {
    freedom.emit('recv-uid', data.name);
  });
}, 0);


