var identity = freedom.identity();
//var transport = freedom.transport();

// deferring execution in a setTimeout produces more comprehensible debugging.
//freedom.on('get-buddylist', function(val) {
  //freedom.emit('recv-buddylist', [makeId(), makeId()]);
//});

setTimeout(function() {
    //Periodically fetch UID, buddy list and forward to UI
  (function getBuddyList() {
    var namepromise = identity.get();
    namepromise.done(function(data) {
      console.log("UID:"+data.name);
    });

    var buddypromise = identity.getBuddyList();
    buddypromise.done(function(data) {
      freedom.emit('recv-buddylist', data);
    });
    setTimeout(getBuddyList, 3000);
  })();
}, 0);


