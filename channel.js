define(["thirdparty/underscore", "thirdparty/backbone"],
function(_, Backbone) {
	"use strict";
	
	/**
   * A Channel can handle RPC requests to some backing layer.
	 */
	var Channel = Backbone.Model.extend({
	  rpc: function(request) {
	  	console.warn("Unimplemented");
	  }
	});

	
	/**
	 * A Direct Channel relays function calls directly to a provider.
	 */
	var DirectChannel = Channel.extend({
		rpc: function(request) {
			var provider = this.get("provider");
			if (provider) {
				provider[request.method].apply(provider, request.args);
			}
		}
	});
	
	/**
	 * Create a function for the provider, which alerts
	 * the creater of the channel.
	 */
	function createStub(method) {
		return function() {
			this.get("sendMessage")({
				method: method,
				args: arguments
			});
		}
	};

	/**
	 * An Indirect Channel reconstructs serialized callbacks.
	 * Callback to a consumer will be serialized to sendMessage.
	 */
	var IndirectChannel = Channel.extend({
		defaults: {
			"sendMessage": function() {}
		},
		rpc: function(request) {
			var provider = this.get("provider");
			if (provider) {
				for (var i = 0; i < request.functionMask.length; i++) {
					if (request.functionMask[i]) {
						request.args[i] = createStub(request.args[i]).bind(this);
					}
				}
				provider[request.method].apply(provider, request.args);
			}
		}
	});
	
	/**
	 * Create a unique identifier for a function, and save a reference
	 * to the function so that it can be later called via 'onMessage'.
	 */
	function getIdentifier(request, func) {
		var self = this;
		if(_.contains(self.waiters, request)) {
			for (var i = 0; i < self.waiters[request].length; i++) {
				if (self.waiters[request][i] == func) {
					return request + "." + i;
				}
			}
			self.waiters[request].push(func);
			return request + "." + (self.waiters[request].length - 1);
		} else {
			self.waiters[request] = [func];
			return request + ".0";
		}
	}

	/**
	 * A Serialized Channel sends function calls as JSON messages.
	 */
	var SerializedChannel = Channel.extend({
		defaults: {
			"sendMessage": function() {}
		},
		initialize: function() {
			this.waiters = {};
			/**
			 * Receive a message back from the provider (behind an indirect channel)
			 * to execute a function earlier supplied in an rpc call.
			 */
			this.on("message", function(msg) {
				var method = msg.method;
				// Method should look like: rpcmethod.index.
				var splitPos = method.lastIndexOf(".");
				if (splitPos <= 0) {
					return console.warning("Unable to handle malformed channel message: " + msg);
				}
				var req = method.substr(0, splitPos);
				var idx = method.substr(splitPos + 1);
				if (this.waiters[req] && this.waiters[req].length > idx) {
					this.waiters[req][idx].call({}, msg.args);
				} else {
					return console.warning("Unable to handle malformed channel message: " + msg);
				}
			});
		},
		rpc: function(request) {
			var funcMask = [];
			for (var i = 0; i < request.args.length; i++) {
				funcMask[i] = typeof request.args[i] == "function";
				if (funcMask[i]) {
					request.args[i] = getIdentifier.call(this, request.method, request.args[i]);
				}
			}
			request["functionMask"] = funcMask;
			this.get("sendMessage")(request);
		},
	});
	
	return {
		Channel: Channel,
		DirectChannel: DirectChannel,
		SerializedChannel: SerializedChannel,
		IndirectChannel: IndirectChannel
	};
});
