define(["underscore"],
function(_) {
	"use strict";
	
	/**
	 * Force a collection of values to look like the types and length of an API template.
	 */
	function conform(template, values) {
		var out = [];
		for (var i = 0; i < template.length; i++) {
			switch(template[i]) {
				case "string":
  				out[i] = "" + values[i];
					break;
				case "number":
  				out[i] = 0 + values[i];
					break;
				case "bool":
  				out[i] = false | values[i];
					break;
				case "obj":
  				out[i] = JSON.parse(JSON.stringify(values[i]));
					break;
				case "callback":
					if (typeof values[i] == "function") {
						out[i] = values[i];						
					} else {
						out[i] = function() {};
					}
					break;
			}
		}
		return out;
	};
	
	/**
	 * Stamp out an object based on an API definition, which
	 * relays function calls back to a given channel.
	 */
	function createStub(definition, channel) {
		var stub = {};
		_.each(definition, function(prop, name) {
			switch(prop.type) {
				case "method":
		  		stub[name] = function() {
		  			channel.rpc({
		  				method: name,
							args: conform(prop.args, arguments)
		  			});
		  		};
					break;
			}
		});
		return stub;
	}
	
	return {
		createStub: createStub
	};
});
