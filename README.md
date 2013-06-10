FreeDOM Core
============

The FreeDOM application logic, and freedom.js.
Platform specific implementations (such as freedom-chrome) will depend on this project.

Compiling
---------

Build FreeDOM locally using

    LOCAL=yes make

FreeDOM also supports compilation using Google's Closure service, which can be accomplished using

    make

The closure service performs variable mangling on the code.  Development should be checked against
both compilation modes for compatibility.

Demos
-------

A set of demos are available in the ```demo``` folder.  To run the demos, first [compile](#compiling) then
visit the demos through a local web server.  This is due to file-protocol restrictions on XHR requests used
by FreeDOM.  A minimal server can be launched using

    python -m SimpleHTTPServer

This static web server will make the demos accessible at [```http://localhost:8000/demo```](http://localhost:8000/demo)
