var channels = [];
var core = freedom.core();

freedom.on('message', function(msg) {
  if(msg.cmd === 'create') {
    core.bindChannel(msg.chan).then(function(id, chan) {
      console.log('channel resolved: ' + id);
      channels[id] = chan;
      chan.on('message', handler.bind({}, id, chan));
    }.bind(this, msg.id));
  } else if (msg.cmd === 'destroy') {
    delete channels[msg.id];
  }
});

var handler = function(cid, chan, msg) {
  freedom.emit('message', 'channel ' + cid + ' sent ' + msg);
  chan.emit('message', 'channel ' + cid + ' replies ' + msg);
};
