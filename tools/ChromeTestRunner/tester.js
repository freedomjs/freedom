var n = 0;

freedom.on('click', function(num) {
	if (num == undefined) {
		num = 1;
	}
	n += num;
  freedom.emit('number', n);
});