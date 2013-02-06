define(["thirdparty/require", "thirdparty/underscore", "thirdparty/backbone", "constants", "channel", "interface"],
function(require, _, backbone, constants, channel, iface) {
	"use strict";

	/**
	 * Make a call over the serialized channel to the parent frame,
	 * passing a token.  Then register a callback listener waiting for that token
	 * to be passed back so that a callback can be executed.
	 */
	function _call(method, args, callback) {
		var token = new Uint8Array(16);
		window.crypto.getRandomValues(token);

		var response = function(msg) {
			if (msg.source == window.parent && msg.data &&
				  msg.data.token && _.isEqual(msg.data.token, token)) {
  			window.removeEventListener('message', response, true);
	  		callback(msg.data.response);
			}
		};

		// TODO(willscott): Don't hardcode dependence on the parent.
		// Should be usable from untrusted web as well.
		window.addEventListener('message', response, true);
		window.parent.postMessage({token: token, method: method, args: args}, '*');
	}
	
	var channels = {};
	
	/**
	 * Register a global event listener for messsages sent on named channels.
	 */
 	// TODO(willscott): don't hardcode dependence on the parent.
	window.addEventListener('message', function(msg) {
		if (msg.source == window.parent && msg.data &&
				msg.data.channel && msg.data.channel in channels) {
					channels[msg.data.channel].trigger("message", msg.data.message);
		}
	}, true);
	
	/**
	 * Register a new named channel with a given ID, return the channel.
	 */
	function _registerChannel(channelId) {
		if (channelId in channels) {
			console.warn("channel '" + channelId + "' was already registered.");
			return false;
		}
		channels[channelId] = new channel.SerializedChannel({"sendMessage": function(msg) {
			_call(channelId, msg, function() {});
		}});
		return channels[channelId];
	}

	/**
	 * Load Providers into the API from the controller.
	 */
	function _loadProviders(api, callback) {
		_call(constants.API.getProviders, {}, function(resp) {
			api.providers = resp;
			callback();
		});
	};
	
	/**
	 * Creates the Public FreeDOM Interface.
	 */
	function API(v) {
		var self = this;
		self._version = v;

    // Make the API an event target.
		_.extend(self, backbone.Events);
		
		_loadProviders(self, function() {});
	};
	
	/**
	 * Application Lifecycle & Communication Events.
	 */
	API.prototype.events = {
		//TODO(willscott): figure out naming of events. Probably worth a class.
		READY: "freedomready"
	};
	
	/**
	 * Registered API Providers.
	 */
	API.prototype.providers = {};

	/**
	 * Request a provider.  The callback will be provided with
	 * the API interface to that provider.
	 * arguments are preferences for configuring the supplied provider.
	 */
	API.prototype.getProvider = function(provider, args, callback) {
		if (!_.contains(this.providers, provider)) {
			callback(null);
		}

		_call(constants.API.establishChannel, {method: provider, args: args}, function(channelId) {
			require([provider], function(def) {
				var chan = _registerChannel(channelId);
				callback(iface.createStub(def, chan));
			});				
		});
	};
		
	return {API: API};
});
