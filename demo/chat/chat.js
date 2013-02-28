var identity = freedom.identity();
//var transport = freedom.transport();

// deferring execution in a setTimeout produces more comprehensible debugging.
//freedom.on('get-buddylist', function(val) {
  //freedom.emit('recv-buddylist', [makeId(), makeId()]);
//});

setTimeout(function() {
  //Print UID
  var promise = identity.get();
  promise.done(function(data) {
    console.log("UID:"+data.name);
  });
  //Periodically fetch buddy list and forward to UI
  (function getBuddyList() {
    var promise = identity.getBuddyList();
    promise.done(function(data) {
      freedom.emit('recv-buddylist', data);
    });
    setTimeout(getBuddyList, 3000);
  })();
}, 0);


