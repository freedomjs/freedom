var identity = freedom.identity();

// deferring execution in a setTimeout produces more comprehensible debugging.
setTimeout(function() {
  var promise = identity.login({});
  promise.done(function(data) {
    freedom.emit('profile', data);
  });
}, 0);
