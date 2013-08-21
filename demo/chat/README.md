FreeDOM Chat Demo
=================

An example chat lobby, where all users join a global buddylist with a GUID.
Messages are directed to a single other user.
We implement a custom identity provider that exposes an identity,
social network, and does the actual forwarding of messages. 
Note that this identity provider can be easily replaced by any other that
exposes the same interface.

The source code for the central identity service is stored in server/router.py
