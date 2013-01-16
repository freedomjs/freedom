define(["freedom!js/api"], function(freedom) {
	"use strict";

  /**
	 * Creation of an untrusted app.
	 * Get message about what to run from the core, and report back loading status.
	 * Handshake looks like:
	 *   FreeDOM     Sandbox
	 *           <-- LOADED
	 * {Version, App} -->
	 *           <-- RUNNING
	 * Subsequent messages are handled by the client API.
	 */

  /**
	 * Message listener from the parent.
	 */
  var creationListener = function(msg) {
		if (msg.source == window.parent && "version" in msg.data && "app" in msg.data) {
			window.freedom = new freedom.API(msg.data["version"]);
  		require(["freedom!" + msg.data["app"]], function() {
	  		window.parent.postMessage("RUNNING", '*');

				window.freedom.trigger(window.freedom.events.READY);
		  });
			window.removeEventListener('message', creationListener, true);
		}
  };
	
	/**
	 * Wait for controller setup message.
	 */
	window.addEventListener('message', creationListener, true);
	
  /**
	 * Send initial 'Loaded' message.
	 */
	window.parent.postMessage("LOADED", '*');
});
