var createTestPort = function(id) {
  var port = {
    id: id,
    messages: [],
    onMessage: function(from, msg) {
      this.messages.push([from, msg]);
      this.emit('onMessage', msg);
    },
    gotMessage: function(from, match) {
      var okay;
      for (var i = 0; i < this.messages.length; i++) {
        if (this.messages[i][0] === from) {
          okay = true;
          for (var j in match) {
            if (this.messages[i][1][j] !== match[j]) {
              okay = false;
            }
          }
          if (okay) {
            return this.messages[i][1];
          }
        }
      }
      return false;
    }
  };

  handleEvents(port);

  return port;
};
