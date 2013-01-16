define([], function() {
	"use strict";
	  
	var Storage = {
		clear: {type: "method", args: ["callback"]},
		set: {type: "method", args: ["string", "string", "callback"]},
		remove: {type: "method", args: ["string", "callback"]},
		get: {type: "method", args: ["string", "callback"]},
		on: {type: "method", args: ["string", "callback"]}
	};

	return Storage;
});
