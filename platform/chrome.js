define(function(require, exports, module) {
	"use strict";
	
	var hub = require("hub"),
			constants = require("constants");
			
	var localStorage = {
		clear: function(cb) {chrome.storage.local.clear(cb);},
		set: function(key, val, cb) {
			var obj = {};
			obj[key] = val;
			chrome.storage.local.set(obj, cb);
		},
		remove: function(key, cb) {chrome.storage.local.remove(key, cb);},
		get: function(key, cb) {chrome.storage.local.get(key, cb);},
		on: function(event, cb) {
			chrome.storage.onChanged.addListener(cb);
		}
	};

	var syncStorage = {
		clear: function(cb) {chrome.storage.sync.clear(cb);},
		set: function(key, val, cb) {
			var obj = {};
			obj[key] = val;
			chrome.storage.sync.set(obj, cb);
		},
		remove: function(key, cb) {chrome.storage.sync.remove(key, cb);},
		get: function(key, cb) {chrome.storage.sync.get(key, cb);},
		on: function(event, cb) {
			chrome.storage.onChanged.addListener(cb);
		}
	};
	
	
	hub.registerProducer(constants.PLATFORM.Storage, function(args) {
		if (_.contains(args, constants.PLATFORM.StorageOptions.HostPersistance)) {
			return localStorage;
		} else if (_.contains(args, constants.PLATFORM.StorageOptions.UserPersistance)) {
			return syncStorage;
		} else { // SessionPersistance
			
		}
	});
});
