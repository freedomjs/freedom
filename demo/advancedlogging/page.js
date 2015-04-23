/*jslint sloppy:true */
/*globals freedom, console*/

/**
 * Bind handlers on startup.
 */
function start(LogClient) {
  var logClient = new LogClient(),
    input = document.getElementById('msg-input');

  input.focus();

  function clearLog() {
    var log = document.getElementById('log');
    log.innerHTML = "";
  }

  function appendLog(contents) {
    var log = document.getElementById('log'),
      el = document.createElement('div');
    //Trim old messages
    while (log.childNodes.length > 36) {
      log.removeChild(log.firstChild);
    }
    el.innerHTML = contents;
    log.appendChild(el);
    el.scrollIntoView();
  }

  // On new messages, append it to our message log
  logClient.on('log', function (data) {
    appendLog(data);
  });

  // Listen for the enter key and send messages on return
  input.onkeydown = function (evt) {
    if (evt.keyCode === 13) {
      var text = input.value;
      input.value = "";
      if (document.getElementById('msg-sync').checked) {
        logClient.emit('warnSync', text);
      } else {
        logClient.emit('warn', text);
      }
    }
  };
}

// Start freedom with a custom logger defined.
window.onload = function () {
  freedom('logger-client.json', {
    logger: 'logger.json'
  }).then(start);
};
