var friend = freedom.friend();
var core = freedom.core();

var channels = {};
var id = 0;

var app = freedom();

app.on('create', function() {
  var thisid = id;
  id += 1;

  core.createChannel().then(function(id, cinfo) {
    channels[id] = cinfo.channel;
    app.emit('message', 'creating custom channel ' + thisid);
    cinfo.channel.on('message', function(msg) {app.emit('message', msg);});
    friend.emit('message', {
      cmd: 'create',
      id: id,
      chan: cinfo.identifier
    });
  }.bind(this, thisid));
});

app.on('destroy', function(id) {
  app.emit('message', 'destroying channel ' + id);
  channels[id].close();
  delete channels[id];
  friend.emit('message', {
    cmd: 'destroy',
    id: id
  });
});

app.on('message', function(id) {
  if(channels[id].peer) {
   app.emit('message', 'sending message to peer ' + id);
   channels[id].send({'channelLabel':'test', 'text':'message to peer ' + id});
 } else {
    app.emit('message', 'sending message to ' + id);
    channels[id].emit('message', 'Message to chan ' + id);
  }
});

app.on('peer', function() {
  var thisid = id;
  id++;
  core.createChannel().then(function(cinfo) {
    var peer = freedom['core.echo']();
    peer.on('message', function(str) { 
      app.emit('message', "from provider: " + JSON.stringify(str));
    });
 
    channels[thisid] = cinfo.channel;
    app.emit('message', 'creating custom channel ' + thisid);
    channels[thisid].on('message', function(m) {
      app.emit('message', "from custom: " + JSON.stringify(m));
    });

    peer.setup(cinfo.identifier);
    channels[thisid] = peer;
    channels[thisid].peer = true;
  });
});

friend.on('message', function(str) {
  app.emit('message', str);
});

