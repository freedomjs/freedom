var identity = freedom.identity();
//var transport = freedom['core.transport']();
var sockId = -1;
var activeJid;

freedom.on('send-message', function(val) {
  //transport.send(sockId, val);
});

/**
freedom.on('open-transport', function(val) {
  function openTransport() {
    sockId = -1;
    var promise = transport.create();
    promise.done(function (data) {
      sockId = data.id;
      console.log('Created PeerConnection: '+sockId);
      identity.send(val, data.offer);
      activeJid = val;
    });
  };

  if (sockId > -1) {
    var closePromise = transport.close(sockId);
    closePromise.done(function () {
      openTransport();
    });
  } else {
    openTransport();
  }
});

identity.on('buddylist', function(list) {
  freedom.emit('recv-buddylist', list);
});

identity.on('message', function(data) {
  //freedom.emit('recv-message', data.message);
  if (sockId == -1) {
    var promise = transport.accept(null, data.message);
    promise.done(function (acceptresp) {
      sockId = acceptresp.id;
      console.log("Accepted PeerConnection offer: "+sockId);
      identity.send(data.from, acceptresp.offer);
    });
  } else {
    transport.accept(sockId, data.message);
  }
});

transport.on('onSignal', function(data) {
  identity.send(activeJid, data);
});

transport.on('onStateChange', function(data) {
  console.log('State change for id='+data.id+' to '+data.state);
});

transport.on('onMessage', function(data) {
  freedom.emit('recv-message', data.id+': '+data.message);
});
**/

identity.on('onStatus', function(msg) {
  freedom.emit('onStatus', msg);
});

var onload = function() {
  //Fetch UID
  identity
    .login('chat-demo', '0.1', '')
    .done(function(data) {
      freedom.emit('recv-uid', data.userId);
    });
};
setTimeout(onload,50);
//onload();


