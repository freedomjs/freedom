/*globals freedom, console*/
var channels = [];
var core = freedom.core();

var instance = freedom();

var handler = function (cid, chan, msg) {
  'use strict';
  instance.emit('message', 'channel ' + cid + ' sent ' + msg);
  chan.emit('message', 'channel ' + cid + ' replies ' + msg);
};

instance.on('message', function (msg) {
  'use strict';
  if (msg.cmd === 'create') {
    core.bindChannel(msg.chan).then(function (id, chan) {
      console.log('channel resolved: ' + id);
      channels[id] = chan;
      chan.on('message', handler.bind({}, id, chan));
    }.bind(this, msg.id));
  } else if (msg.cmd === 'destroy') {
    delete channels[msg.id];
  }
});

// Also provide an interface with an explicit API.
var AltIface = function () {
  'use strict';
};

AltIface.prototype.testMethod = function (query) {
  'use strict';
  return 'answer ' + query;
};

freedom.alternative().provideSynchronous(AltIface);
