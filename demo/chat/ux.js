/*
 * These functions provide interaction for the freedom.js chat demo.
 */
window.onload = function() {
  document.getElementById('msg-input').focus();
  // If messages are going to a specific user, store that here.
  var activeBuddylistEntry;
  var buddylist;

  function clearLog() {
    var log = document.getElementById('messagelist');
    log.innerHTML = "";
  }

  function appendLog(elt) {
    var log = document.getElementById('messagelist');
    //Trim old messages
    while (log.childNodes.length > 36) {
      log.removeChild(log.firstChild);
    }
    log.appendChild(elt);
    var br = document.createElement('br');
    log.appendChild(br);
    br.scrollIntoView();
  }

  function makeDisplayString(buddylistEntry) {
    return buddylistEntry.name && buddylistEntry.name != buddylistEntry.userId ?
        buddylistEntry.name + ' (' + buddylistEntry.userId + ')' :
        buddylistEntry.userId;
  }

  function redrawBuddylist() {
    var onClick = function(buddylistEntry, child) {
      console.log("Messages will be sent to: " + buddylistEntry.userId);
      activeBuddylistEntry = buddylistEntry;
      redrawBuddylist();
      document.getElementById('msg-input').focus();
    };

    var buddylistDiv = document.getElementById('buddylist');
    // Remove all elements in there now
    buddylistDiv.innerHTML = "<b>Buddylist</b>";

    // Create a new element for each buddy
    for (var userId in buddylist) {
      var child = document.createElement('div');
      if (activeBuddylistEntry == buddylist[userId]) {
        child.innerHTML = "[" + makeDisplayString(buddylist[userId]) + "]";
      } else {
        child.innerHTML = makeDisplayString(buddylist[userId]);
      }
      // If the user clicks on a buddy, change our current destination for messages
      child.addEventListener('click', onClick.bind(this, buddylist[userId], child), true);
      buddylistDiv.appendChild(child);
    }

  }
  
  // on changes to the buddylist, redraw entire buddylist
  window.freedom.on('recv-buddylist', function(val) {
    buddylist = val;
    redrawBuddylist();
  });

  // On new messages, append it to our message log
  window.freedom.on('recv-message', function(data) {
    // Show the name instead of the userId, if it's available.
    var userId = data.from.userId;
    var displayName = buddylist[userId].name || userId;
    var message = displayName + ": " + data.message;
    appendLog(document.createTextNode(message));
  });
  
  // On new messages, append it to our message log
  window.freedom.on('recv-err', function(data) {
    document.getElementById('uid').textContent = "Error: "+data.message;
  });

  // Display our own userId when we get it
  window.freedom.on('recv-uid', function(data) {
    document.getElementById('uid').textContent = "Logged in as: " + data;
  });

  // Display the current status of our connection to the Social provider
  window.freedom.on('recv-status', function(msg) {
    if (msg && msg == 'online') {
      document.getElementById('msg-input').disabled = false;
    } else {
      document.getElementById('msg-input').disabled = true;
    }
    clearLog();
    var elt = document.createElement('b');
    elt.appendChild(document.createTextNode('Status: ' + msg));
    appendLog(elt);
  });

  // Listen for the enter key and send messages on return
  var input = document.getElementById('msg-input');
  input.onkeydown = function(evt) {
    if (evt.keyCode == 13) {
      var text = input.value;
      input.value = "";
      appendLog(document.createTextNode("You: " + text));
      window.freedom.emit('send-message',
          {to: activeBuddylistEntry.userId, message: text});
    }
  };
};
