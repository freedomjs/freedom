var providers = {
//  "core": freedom.core(),
//  "storage.shared": freedom.storageShared(),
//  "storage.isolated": freedom.storageIsolated(),
//  "transport.webrtc": freedom.transportWebrtc()
};

// action = {
//  name: name to store provider under in 'providers' object, 
//  provider: name in manifest
// }
freedom.on('create', function(action) {
  providers[action.name] = freedom[action.provider]();
});

// action = {
//  id: unique ID of call (tied to result), 
//  name: name of provider in 'providers' object, 
//  method: method to call, 
//  args: array of arguments to method}
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
