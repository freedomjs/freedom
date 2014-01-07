FreeDOM Chat Demo
=================

An example chat lobby, where your buddylist is displayed alongside a message log.
You can click on another user and send directed private messages to them.

The current example uses a specific social provider that implements a
global buddylist, where each user is assigned a random GUID.
(source in /providers/social/websocket-server/)

Note that this social provider can be easily replaced by any other that exposes the same Social API.
We have drop-in replacements that connect to an XMPP server (such as G+ or Facebook),
which the application can then use without any changes to their application code.
