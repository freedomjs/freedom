define(["underscore", "backbone", "js/constants", "js/channel"],
function(_, backbone, constants, channel) {
	"use strict";

	var producers = {};
	
	var handlers = {};

	var filters = {};

	/**
	 * Creates the dispatch hub for cross-domain communication
	 */
	function Hub() {
		var self = this;
		self.registerHandler(constants.API.getProviders, getProducers.bind(self));
		self.registerHandler(constants.API.establishChannel, establishChannel.bind(self));
		self.filter(constants.API._getProvider, function(s, a) {
			return s == constants.CORE.Sender;
		});
		self.registerHandler(constants.API._getProvider, getProvider.bind(self));
	};
	
	/**
	 * Get a list of all registered producers/APIs.
	 * Available to all sources.
	 */
	function getProducers() {
		var p = [];
		_.each(producers, function(producer, key) {
			p.push(key);
		});
		return function(sandbox, respond) {
			respond(p)
		};
	}
	
	/**
	 * Create an indirect cahnnel around a requested provider.
	 * Available to all sources.
	 */
	function establishChannel(args, source) {
		var method = args.method;
		var args = args.args;

		if (method in filters) {
			if (!_.all(filters[method], function(predicate) {
				return predicate(source, args);
			})) {
				return false;
			}
		}
		
		if (!(method in producers)) {
			return false;
		}

		var producer = new producers[method](args);
		//TODO: make these conflict less.
		var channelId = source + "_" + method + "_" + Math.random();
		this.filter(channelId, function(s, a) {
			return s == source;
		});

		return function(sandbox, respond) {
			var chan = new channel.IndirectChannel({"provider": producer, "sendMessage": sandbox.postOnChannel(channelId)});
			handlers[channelId] = chan.rpc.bind(chan);
			respond(channelId);
		}
	}
	
	/**
	 * 'Private' hub call for getting direct access to a provider.
	 * Limited to CORE.Sender permissions.
	 */
	function getProvider(args, source) {
		var method = args.method;
		var args = args.args;

		return new producers[method](args);
	}

	/**
	 * Register an API producer, which can be exposed through a channel.
	 */
	Hub.prototype.registerProducer = function(api, provider) {
		if (api in producers) {
			console.warn("Producer " + api + " already exists.");
			return false;
		} else {
			producers[api] = provider;
			return true;
		}
	};

	/**
	 * Register a handler available for public consumption.
	 */
	Hub.prototype.registerHandler = function(method, handler) {
		if (method in handlers) {
			console.warn("Handler " + method + " already exists.");
			return false;
		} else {
			handlers[method] = handler;
			return true;
		}
	};
	
	/**
	 * All requests for handlers begin here.
	 */
	Hub.prototype.req = function(method, source, args) {
		if (method in filters) {
			if (!_.all(filters[method], function(predicate) {
				return predicate(source, args);
			})) {
				return false;
			}
		}

		if (method in handlers) {
			return handlers[method](args, source);
		} else {
			return false;
		}
	};
	
	/**
	 * Create a new filter limiting allowed calls.
	 */
	Hub.prototype.filter = function(method, predicate) {
		if (method in filters) {
			filters[method].push(predicate);
		} else {
			filters[method] = [predicate];
		}
	};
	
	return new Hub();
});
