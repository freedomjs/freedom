define(["sandboxmanager"],
function(sandboxManager) {
	"use strict";

	var _bundles = null;
	
	var _sandboxes = {};
	
	/**
	 * String processing for bundles
	 */
	function _getBundles() {
		if (!_bundles) {
			return [];
		} else if (_bundles.indexOf(",") !== false) {
			return _bundles.split(",");
		} else {
			return [_bundles];
		}
	}
	
	/**
	 * Make sure the correct sandboxes are in existance.
	 */
	function _restoreSandboxes() {
		var current = Object.keys(_sandboxes);
		var toAdd = [];
		for(var b = _getBundles(), l = b.length, i = 0; i < l; i++) {
			if(_sandboxes[b[i]]) {
				var idx = current.indexOf(b[i]);
				if (idx != -1) current.splice(idx, 1);
			} else {
				toAdd.push(b[i]);
			}
		}
		
		for(var i = 0; i < current.length; i++) {
			_sandboxes[current[i]].remove();
			delete _sandboxes[current[i]];
		}
		
		for(var i = 0; i < toAdd.length; i++) {
			_sandboxes[toAdd[i]] = new sandboxManager(toAdd[i]);
		}
	}
	
	return {
		/**
		 * Updated loaded FreeDOM bundles, based on user installation / removal.
		 */
		update: function(bundle) {
			_bundles = bundle;
			_restoreSandboxes();
		}
	};
});
