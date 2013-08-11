FreeDOM
=======
[![Build Status](https://travis-ci.org/UWNetworksLab/freedom.png?branch=master)](https://travis-ci.org/UWNetworksLab/freedom)

This repository contains FreeDOM, a modular runtime for distributed projects.
FreeDOM lets you build complex web services without the costs of centralized
infrastructure. Instead, FreeDOM will manage code and data distribution on top
of user resources.

Installation
---------

Compile FreeDOM by running

    LOCAL=yes make

FreeDOM also supports compilation using Google's Closure service, which can be accomplished using

    make

The closure service performs variable mangling on the code.  Development should be checked against
both compilation modes for compatibility.

Contributing
---------

FreeDOM is unit tested & linted to maintain code quality.
Run ```grunt``` in the base FreeDOM library to test your changes before commit.

Demos
-------

Demos are available in the ```demo``` folder.  FreeDOM should be [compiled](#installation)
before running the demos.  The demos should be viewed through a local web server,
due to browser safety restrictions on local XHR requests.
A minimal server can be launched by running

    python -m SimpleHTTPServer

This static web server will make the demos accessible at [```http://localhost:8000/demo```](http://localhost:8000/demo)
