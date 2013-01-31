define(["freedom!constants",
			  "freedom!hub"], function(constants, hub) {
	"use strict";
	/**
	var storage = hub.req(constants.API._getProvider, constants.CORE.Sender, {
		method: constants.PLATFORM.Storage,
		args: [constants.PLATFORM.StorageOptions.UserPersistance]
	});

	var appval = document.getElementById("apps");
	storage.get(constants.CORE.Bundles, function(val) {
		for (var key in val) {
			if (key == constants.CORE.Bundles) {
				appval.value = val[key];
			}
		}
	});
	appval.addEventListener('change', function() {
		var prefs = {};
		prefs[constants.CORE.Bundles] = appval.value;
		storage.set(prefs, function() {})
	}, true);
	**/
});
