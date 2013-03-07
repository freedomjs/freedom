var identity = freedom.identity();

setTimeout(function() {
  //Fetch UID
  var namepromise = identity.get();
  namepromise.done(function(data) {
    freedom.emit('recv-uid', data.name);
  });
}, 0);


