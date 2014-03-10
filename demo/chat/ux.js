/*
 * These functions provide interaction for the freedom.js chat demo.
 */
window.onload = function() {
  document.getElementById('msg-input').focus();
  // If messages are going to a specific user, store that here.
  var activeId;

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
  
  // on changes to the buddylist, redraw entire buddylist
  window.freedom.on('recv-buddylist', function(val) {
    var onClick = function(jid, child) {
      if (activeId != jid) {
        activeId = jid;
        child.innerHTML = "[" + val[i] + "]";
      } else {
        activeId = undefined;
        child.innerHTML = val[i];
      }
      console.log("Messages will be sent to: " + activeId);
      document.getElementById('msg-input').focus();
    };

    var buddylist = document.getElementById('buddylist');
    // Remove all elements in there now
    buddylist.innerHTML = "<b>Buddylist</b>";

    // Create a new element for each buddy
    for (var i in val) {
      var child = document.createElement('div');
      child.innerHTML = val[i];
      // If the user clicks on a buddy, change our current destination for messages
      child.addEventListener('click', onClick.bind(this, val[i], child), true);
      buddylist.appendChild(child);
    }
  });
  // On new messages, append it to our message log
  window.freedom.on('recv-message', function(data) {
    var message = data.from.userId + ": " + data.message;
    appendLog(document.createTextNode(message));
  });

  // Display our own userId when we get it
  window.freedom.on('recv-uid', function(data) {
    document.getElementById('uid').innerText = "Logged in as: "+data;
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
      window.freedom.emit('send-message', {to: activeId, message: text});
    }
  };
};
