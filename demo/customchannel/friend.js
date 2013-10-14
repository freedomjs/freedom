var channels = [];
var core = freedom.core();

freedom.on('message', function(msg) {
	if(msg.cmd === 'create') {
		core.bindChannel(msg.chan).done(function(id, chan) {
			console.log('channel resolved: ' + id);
			channels[id] = chan;
			chan.on('message', handler.bind({}, id));
		}.bind(this, msg.id));
	} else if (msg.cmd === 'destroy') {
		delete channels[msg.id];
	}
});

var handler = function(cid, msg) {
	console.log('got Message!');
	freedom.emit('message', 'channel ' + cid + ' sent ' + msg);
};
