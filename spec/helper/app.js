var child = freedom.child();

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
