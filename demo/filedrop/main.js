/**
 * This is the root module of our FreeDOM backend.
 * It runs in an isolated thread with its own namespace.
 * The root module has a special object 'freedom', which
 * is used as a message-passing channel to its parent (the outer webpage)
 **/
var window;
if (!window) {
  window = {};
}
var n = 0;
var file = null;
var social = freedom.socialprovider();
var networks = {};
var roster = {};
console.log('File Drop root module');

// On 'click' events, add it to our global count
// and emit the total back to the outer page
freedom.on('click', function(num) {
	if (num == undefined) {
		num = 1;
	}
	n += num;
  freedom.emit('number', n);
});

freedom.on('serve-data', function(data) {
  file = data;

  freedom.emit('serve-url', 'yo');

});

social.on('onStatus', function(msg) {
  if (!networks.hasOwnProperty(msg.network)) {
    social.login({
      network: msg.network,
      agent: 'filedrop', 
      version: '0.1', 
      url: '',
      interactive: true 
    });
  }
  networks[msg.network] = msg;
});

social.on('onChange', function(data) {
  roster[data.userId] = data
});

social.on('onMessage', function(data) {

});
