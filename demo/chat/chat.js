//var identity = freedom.identity();
//var transport = freedom.transport();

// deferring execution in a setTimeout produces more comprehensible debugging.
setTimeout(function() {
  freedom.emit('chat', "Poop1");
  freedom.emit('chat', "Poop2");
/**
  var promise = identity.get();
  promise.done(function(data) {
    freedom.emit('profile', data);
  });
  **/
}, 0);
