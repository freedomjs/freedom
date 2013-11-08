window.onload = function() {
	document.getElementById('click').onclick = function() {
		window.freedom.emit('click', 1);
	}
	window.freedom.on('number', function(n) {
		document.getElementById('count').innerHTML = n;
	});
	window.freedom.emit('click', 0);
}