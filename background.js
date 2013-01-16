define(["freedom!js/bundlemanager",
        "freedom!js/constants",
				"freedom!js/platform/chrome",
				"freedom!js/hub"], function(bundleManager, constants, chrome, hub) {
	"use strict";
	
	var storage = hub.req(constants.API._getProvider, constants.CORE.Sender, {
		method: constants.PLATFORM.Storage,
		args: [constants.PLATFORM.StorageOptions.UserPersistance]
	});
	
  // On trust change.
	storage.on("change", function(changes, namespace) {
		for (var key in changes) {
			if (key == constants.CORE.Bundles) {
				bundleManager.update(changes[key].newValue);
			}
		}
	});

	// On extension startup.
	bundleManager.update(storage.get(constants.CORE.Bundles, function(values) {
		for (var key in values) {
			if (key == constants.CORE.Bundles) {
				bundleManager.update(values[key]);
			}			
		}
	}));
});
