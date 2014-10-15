/*jslint sloppy:true */
/*globals freedom */
var friend = freedom.friend();
var af = freedom.altfriend();
var core = freedom.core();

var channels = {};
var id = 0;

var instance = freedom();
instance.on('create', function () {
  var thisid = id;
  id += 1;

  instance.emit('message', 'creating custom channel ' + thisid);
  core.createChannel().then(function (id, cinfo) {
    channels[id] = cinfo.channel;
    channels[id].on('message', function (msg) {
      instance.emit('message', msg);
    });
    friend.emit('message', {
      cmd: 'create',
      id: id,
      chan: cinfo.identifier
    });
  }.bind(this, thisid));
});

instance.on('destroy', function (id) {
  instance.emit('message', 'destroying channel ' + id);
  channels[id].close();
  delete channels[id];
  friend.emit('message', {
    cmd: 'destroy',
    id: id
  });
});

instance.on('message', function (id) {
  instance.emit('message', 'sending message to ' + id);
  channels[id].emit('message', 'Message to chan ' + id);
});

instance.on('alternative', function (q) {
  af.testMethod(q).then(function (answer) {
    instance.emit('message', 'got: ' + answer);
  });
});

instance.on('peer', function () {
  var thisid = id;
  id += 1;
  core.createChannel().then(function (cinfo) {
    var peer = freedom['core.echo']();
    peer.on('message', function (str) {
      instance.emit('message', "from provider: " + JSON.stringify(str));
    });
    
    channels[thisid] = cinfo.channel;
    channels[thisid].on('message', function (m) {
      instance.emit('message', "from custom: " + JSON.stringify(m));
    });
    channels[thisid].onClose(function () {
      freedom['core.echo'].close(peer);
    });
 
    peer.setup(cinfo.identifier);
  });
});

friend.on('message', function (str) {
  instance.emit('message', str);
});

