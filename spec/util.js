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

var fdom_src;
var getFreedomSource = function(id) {
  if(typeof fdom_src === 'undefined'){
    try {
      var xhr = new XMLHttpRequest();
      xhr.open("get", "freedom.js", false);
      xhr.overrideMimeType("text/javascript; charset=utf-8");
      xhr.send(null);
      fdom_src = xhr.responseText;
    } catch (err) { // Synchronous XHR wont work in Chrome App (Chrome Test Runner), so load from global var.
      if (typeof jasmine.getGlobal().freedom_src !== 'undefined') {
        fdom_src = jasmine.getGlobal().freedom_src;
      } else {
        throw "Could not load freedom source from XHR or global var. To work in a Chrome App, getFreedomSource() must be called from a jasmine test case or beforeEach()";
      }
    }
  }
  return fdom_src;
}