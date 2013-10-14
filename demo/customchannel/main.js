var friend = freedom.friend();
var core = freedom.core();

var channels = {};
var id = 0;

freedom.on('create', function() {
  var thisid = id;
  id += 1;

  core.createChannel().done(function(id, cinfo) {
    cinfo.channel.done(function(id, chan) {
      channels[id] = chan;
    }.bind(this, id));
    friend.emit('message', {
      cmd: 'create',
      id: id,
      chan: cinfo.identifier
    });
  }.bind(this, thisid));
});

freedom.on('destroy', function(id) {
  delete channels[id];
  friend.emit('message', {
    cmd: 'destroy',
    id: id
  });
});

freedom.on('message', function(id) {
  channels[id].emit('message', 'Message to chan ' + id);
});

friend.on('message', function(str) {
  freedom.emit('message', str);
});
