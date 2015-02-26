/*jslint sloppy:true */
/*globals freedom */
var friend = freedom.friend();
var af = freedom.altfriend();
var core = freedom.core();

var channels = {};
var id = 0;

var page = freedom();
page.on('create', function () {
  var thisid = id;
  id += 1;

  page.emit('message', 'creating custom channel ' + thisid);
  core.createChannel().then(function (id, cinfo) {
    channels[id] = cinfo.channel;
    channels[id].on('message', function (msg) {
      page.emit('message', msg);
    });
    friend.emit('message', {
      cmd: 'create',
      id: id,
      chan: cinfo.identifier
    });
  }.bind(this, thisid));
});

page.on('destroy', function (id) {
  page.emit('message', 'destroying channel ' + id);
  channels[id].close();
  delete channels[id];
  friend.emit('message', {
    cmd: 'destroy',
    id: id
  });
});

page.on('message', function (id) {
  page.emit('message', 'sending message to ' + id);
  channels[id].emit('message', 'Message to chan ' + id);
});

page.on('alternative', function (q) {
  af.testMethod(q).then(function (answer) {
    page.emit('message', 'got: ' + answer);
  });
});

page.on('peer', function () {
  var thisid = id;
  id += 1;
  core.createChannel().then(function (cinfo) {
    var peer = freedom['core.echo']();
    peer.on('message', function (str) {
      page.emit('message', "from provider: " + JSON.stringify(str));
    });
    
    channels[thisid] = cinfo.channel;
    channels[thisid].on('message', function (m) {
      page.emit('message', "from custom: " + JSON.stringify(m));
    });
    channels[thisid].onClose(function () {
      freedom['core.echo'].close(peer);
    });
 
    peer.setup(cinfo.identifier);
  });
});

page.on('mkerr', function () {
  throw new Error("I am a custom error");
});

friend.on('message', function (str) {
  page.emit('message', str);
});

