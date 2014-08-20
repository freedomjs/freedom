var friend = freedom.friend();
var core = freedom.core();

var channels = {};
var id = 0;

var external = freedom();
external.on('create', function() {
  var thisid = id;
  id += 1;

  external.emit('message', 'creating custom channel ' + thisid);
  core.createChannel().then(function(id, cinfo) {
    channels[id] = cinfo.channel;
    channels[id].on('message', function(msg) {external.emit('message', msg);});
    friend.emit('message', {
      cmd: 'create',
      id: id,
      chan: cinfo.identifier
    });
  }.bind(this, thisid));
});

external.on('destroy', function(id) {
  external.emit('message', 'destroying channel ' + id);
  channels[id].close();
  delete channels[id];
  friend.emit('message', {
    cmd: 'destroy',
    id: id
  });
});

external.on('message', function(id) {
  external.emit('message', 'sending message to ' + id);
  channels[id].emit('message', 'Message to chan ' + id);
});

external.on('peer', function() {
  var thisid = id;
  id++;
  core.createChannel().then(function(cinfo) {
    var peer = freedom['core.echo']();
    peer.on('message', function(str) { 
      external.emit('message', "from provider: " + JSON.stringify(str));
    });
    
    channels[thisid] = cinfo.channel;
    channels[thisid].on('message', function(m) {
      external.emit('message', "from custom: " + JSON.stringify(m));
    });
    channels[thisid].onClose(function() {
      external['core.echo'].close(peer);
    });
 
    peer.setup(cinfo.identifier);
  });
});

friend.on('message', function(str) {
  external.emit('message', str);
});

