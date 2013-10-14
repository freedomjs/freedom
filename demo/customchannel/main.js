var friend = freedom.friend();
var core = freedom.core();

var channels = {};
var id = 0;

freedom.on('create', function() {
  var thisid = id;
  id += 1;

  freedom.emit('message', 'creating custom channel ' + thisid);
  core.createChannel().done(function(id, cinfo) {
    cinfo.channel.done(function(id, chan) {
      channels[id] = chan;
      chan.on('message', function(msg) {freedom.emit('message', msg)})
    }.bind(this, id));
    friend.emit('message', {
      cmd: 'create',
      id: id,
      chan: cinfo.identifier
    });
  }.bind(this, thisid));
});

freedom.on('destroy', function(id) {
  freedom.emit('message', 'destroying channel ' + id);
  delete channels[id];
  friend.emit('message', {
    cmd: 'destroy',
    id: id
  });
});

freedom.on('message', function(id) {
  freedom.emit('message', 'sending message to ' + id);
  channels[id].emit('message', 'Message to chan ' + id);
});

friend.on('message', function(str) {
  freedom.emit('message', str);
});
