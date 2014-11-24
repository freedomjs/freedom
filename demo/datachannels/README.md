Data Channels
======

This is a simple example of how to build a peer-to-peer application using a
freedom.js module structure. This example is allows you to copy-and-paste
between two active WebRTC clients, and start up a local connection between
the two. The same process should work to establish a direct connection between
two remote computers.

The WebRTC connection process is somewhat involved, as this demonstration
shows, and we recommend the use of the built-in freedom.js transport interface
to achieve the same functionality with the connection setup work already done
for you. However, if you need explicit control over the webRTC communication,
in order to do key management, extract the video channel of the same
connection, or otherwise - you will need to handle the complexity yourself.
