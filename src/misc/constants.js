define(function(require, exports, module) {
	"use strict";
	
	var PLATFORM = {
		Storage: "interface/storage",
		StorageOptions: {
			SessionPersistance: "platformstorage.sessionPersistance",
			HostPersistance: "platformstorage.hostPersistance",
			UserPersistance: "platformstorage.userPersistance"
		}
	};
	
  var API = {
  	/* Methods */
		getProviders: "getproviders",
		establishChannel: "createchannel",

		/* Private Methods */
		_getProvider: "_getprovider",
  };
	
	var CORE = {
		/* Loaded Bundles. */
		Bundles: "defineasconstant_BUNDLES",
		Sender: "coreSender"
	};

	exports.API = API;
	exports.CORE = CORE;
	exports.PLATFORM = PLATFORM;
});
