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