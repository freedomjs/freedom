var sharedStorage = freedom.sharedStorage();

freedom.on('call', function(callJson){
	call = JSON.parse(callJson);
	promise = sharedStorage[call.method].apply(null, call.args);
	promise.done(function(ret){
		retJson = JSON.stringify(ret);
		freedom.emit('return', retJson);
	});
});