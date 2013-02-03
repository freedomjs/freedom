var n = 0;

var click = function(num) {
	if (num == undefined) {
		num = 1;
	}
	n += num;
	var event = createEvent("Event");
	event.initEvent("number", true, true);
	event.data = n;
	dispatchEvent(event);
}