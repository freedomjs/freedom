freedom.on("ws-ready", function() {
  var social = freedom.social();
  freedom.emit("ws-app-ready");
  
});

