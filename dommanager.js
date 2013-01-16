define(function(require, exports, module) {
	"use strict";

  var _el = document.createElement("div");
	_el.style.display = "none";
	document.body.appendChild(_el);

  /**
	 * Create a new dom element	
	 */
	function create(tag) {
		var e = document.createElement(tag);
		_el.appendChild(e);
		return e;
	};
	
	function remove(e) {
		if (e.parentNode && e.parentNode == _el) {
			_el.removeChild(e);
		}
	};

	
	exports.create = create;
	exports.remove = remove;
});
