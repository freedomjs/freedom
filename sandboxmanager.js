define(["dommanager", "hub"],
function(dom, hub) {
	"use strict";
	
	var state = {
		LOADING: 0,
		LOADED: 1,
		RUNNING: 2
	};
	
	// TODO(willscott): Document the communication channel between frames.
	var version = 1.0;

	/**
	 * Create a new sandbox with a given identifier.
	 */
	function SandboxManager(id) {
		var self = this;
		self._id = id;
		self._state = state.LOADING;
		self._el = dom.create("iframe");
		self._el.src = chrome.extension.getURL("sandbox.html");
		self._listener = listener.bind(this, id);
		window.addEventListener('message', self._listener, true);
	};
	
	// Listen for messages from the sandbox.
	function listener(id, msg) {
		if (msg.source == this._el.contentWindow) {
			if (this._state == state.LOADING && msg.data == "LOADED") {
				this.post({version: version, app: id});
				this._state = state.LOADED;
			} else if (this._state == state.LOADED && msg.data == "RUNNING") {
				this._state = state.RUNNING;
				
				// Forward messages to the FreeDOM Core.
			} else if (this._state != state.LOADING) {
				if("method" in msg.data && "token" in msg.data) {
					// Ask the Hub For Data.
				  var resp = hub.req(msg.data["method"], id, msg.data.args);

					// Callback responds to the frame with the result of it's request.
					var callback = function(response) {
						this.post({token: msg.data["token"], response: response});
					};

					// The Hub may want to call 'postOnChannel' to establish a named
					// channel to the frame.
					if (typeof resp == "function") {
						resp(this, callback.bind(this));
					} else {
						callback.call(this);
					}
				}
			}
		}
	}
	
	// Send a message to the sandbox.
	SandboxManager.prototype.post = function(msg) {
		this._el.contentWindow.postMessage(msg, '*');
	};
	
	// Create a function for sending to the sandbox with an extra identifier.
	SandboxManager.prototype.postOnChannel = function(channel) {
		var sendMsg = function(msg) {
			this.post({channel: channel, message: msg});
		};
		return sendMsg.bind(this);
	};

	/**
	 * Removal notification for a sandbox.
	 */
	SandboxManager.prototype.remove = function() {
		console.log("Sandbox removed for " + this._id);
		window.removeEventListener('message', this._listener, true);
		dom.remove(this._el);
	};
	
	return SandboxManager;
});
