freedom.on('input', function(value) {
  console.log('got ' + value);
  freedom.emit('output', value);
});
