var providers = {
  "storage.shared": freedom.storageShared(),
  "storage.isolated": freedom.storageIsolated(),
  "transport.webrtc": freedom.transportWebrtc(),
  "social.websocketsA": freedom.socialWebsockets(),
  "social.websocketsB": freedom.socialWebsockets()
};


freedom.on('call', function(action){
  var p = providers[action.provider];
	var promise = p[action.method].apply(null, action.args);
	promise.done(function(ret){
		freedom.emit('return', {
      id: action.id,
      data: ret
    });
	});
});

freedom.on('listenForEvent', function(listenInfo) {
  function onEvent(eventData) {
    freedom.emit('event', eventData);
  }
  providers[listenInfo.provider].on(listenInfo.event, onEvent);
});
