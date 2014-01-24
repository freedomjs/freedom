var providers = {
  "storage.shared": freedom.storageShared(),
  "storage.isolated": freedom.storageIsolated(),
  "transport.webrtc": freedom.transportWebrtc()
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
