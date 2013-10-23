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
      freedom.emit('message', 'creating custom channel ' + thisid);
      chan.on('message', function(msg) {freedom.emit('message', msg);});
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
  if(channels[id].peer) {
   freedom.emit('message', 'sending message to peer ' + id);
   channels[id].send({'channelLabel':'test', 'text':'message to peer ' + id});
 } else {
    freedom.emit('message', 'sending message to ' + id);
    channels[id].emit('message', 'Message to chan ' + id);
  }
});

freedom.on('peer', function() {
  var thisid = id;
  id++;
  core.createChannel().done(function(cinfo) {
    var peer = freedom['core.echo']();
    peer.on('message', function(str) { 
      freedom.emit('message', "from provider: " + JSON.stringify(str));
    });
 
    cinfo.channel.done(function(chan) {
      channels[thisid] = chan;
      freedom.emit('message', 'creating custom channel ' + thisid);
      chan.on('message', function(m) {
        freedom.emit('message', "from custom: " + JSON.stringify(m));
      });
    });

    peer.setup(cinfo.identifier);
    channels[thisid] = peer;
    channels[thisid].peer = true;
  });
});

friend.on('message', function(str) {
  freedom.emit('message', str);
});

