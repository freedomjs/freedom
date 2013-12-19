var createTestPort = function(id) {
  var port = {
    id: id,
    messages: []
  }
  handleEvents(port);

  port.onMessage = function(from, msg) {
    this.messages.push([from, msg]);
    this.emit('onMessage', msg);
  };

  port.gotMessage = function(from, match) {
    var okay;
    for (var i = 0; i < messages.length; i++) {
      if (messages[i][0] === from) {
        okay = true;
        for (var j in match) {
          if (messages[i][1][j] !== match[j]) {
            okay = false;
          }
        }
        if (okay) {
          return true;
        }
      }
    }
    return false;
  };

  return port;
};
