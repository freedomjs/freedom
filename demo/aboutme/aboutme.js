var identity = freedom.identity();
identity.on('identity', function(data) {
  freedom.emit('profile', data);
});

//identity.emit('identity', null);
