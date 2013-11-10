/**
 * This is the root module of our FreeDOM backend.
 * It runs in an isolated thread with its own namespace.
 * The root module has a special object 'freedom', which
 * is used as a message-passing channel to its parent (the outer webpage)
 **/
var n = 0;
console.log("Hello World!");

// On 'click' events, add it to our global count
// and emit the total back to the outer page
freedom.on('click', function(num) {
	if (num === undefined) {
		num = 1;
	}
	n += num;
  freedom.emit('number', n);
});
