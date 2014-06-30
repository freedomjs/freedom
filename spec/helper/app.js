var child = freedom.child();
var log = freedom.log();

freedom.on('input', function(value) {
  //console.log('got ' + value);
  freedom.emit('output', value);
});

// For testing child dependencies
freedom.on('child-input', function(value) {
  child.emit('input', value);
});
child.on('output', function(value) {
  freedom.emit('child-output', value);
});

// For testing manifest-defined apis
freedom.on('do-log', function(value) {
  log.log(value);
});

freedom.on('get-log', function() {
  log.getLog().then(function(output) {
    freedom.emit('log', output);
  });
});