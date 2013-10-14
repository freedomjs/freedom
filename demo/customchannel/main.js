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
    core.createChannel().done(function(cinfo, c2info) {
      var peerEnd1 = freedom['core.sctp-peerconnection']();
      var peerEnd2 = freedom['core.sctp-peerconnection']();

      peerEnd1.peer = true;
      channels[thisid] = peerEnd1;

      peerEnd2.on('onReceive', function(str) {
        freedom.emit('message', "from Peer Connection Round Trip: " + JSON.stringify(str));
      });

 
      c2info.channel.done(function(chan) {
        channels[thisid].c2 = chan;
        chan.on('message', function(m) {
          channels[thisid].c.emit('message', m);
        });
      });

      cinfo.channel.done(function(chan) {
        channels[thisid].c = chan;
        chan.on('message', function(m) {
          channels[thisid].c2.emit('message', m);
        });
      });

      // Set them up.
      peerEnd1.setup(cinfo.identifier);
      peerEnd2.setup(c2info.identifier);
    }.bind(this, cinfo));
  });
});

friend.on('message', function(str) {
  freedom.emit('message', str);
});

