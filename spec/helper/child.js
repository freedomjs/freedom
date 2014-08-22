var app = freedom();

app.on('input', function(value) {
  //console.log('got ' + value);
  app.emit('output', value);
});
