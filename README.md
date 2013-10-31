FreeDOM
=======
[![Build Status](https://travis-ci.org/UWNetworksLab/freedom.png?branch=master)](https://travis-ci.org/UWNetworksLab/freedom)

FreeDOM is a runtime for distributed web applications.

We don't get in the way of your app, but let you build complex web services
without worrying about where data or code will reside. Instead, FreeDOM takes
care of the distributed systems work to reduce your costs, keep your users in
control of their data, and make your app as available and convenient as a
cloud-based approach.

Using FreeDOM
---------

If you just want the code, the curent version is automatically built [here](https://homes.cs.washington.edu/~wrs/freedom.js).

Documentation on using and working with FreeDOM, and how to structure your
application to align with the philosophy of the FreeDOM library are available
on the [wiki](https://github.com/UWNetworksLab/freedom/wiki).

Demos
-------

Demos are available in the ```demo``` folder.  FreeDOM must be [compiled](#development)
before running the demos.  There is a known bug that the demos will fail when
accessed from a ```file://``` url, due to security restrictions on access to
local files.  You can access demos locally by running

    make demo

and then visiting [```http://localhost:8000/demo```](http://localhost:8000/demo).

Or, browse the demos online [here](https://homes.cs.washington.edu/~wrs/demo/).

Note: FreeDOM has only been tested using Chrome and Firefox.
Other browsers may experience issues.

Development
---------

FreeDOM can be compiled locally by running

    make

or by running

    grunt

Contributing
---------

FreeDOM is unit tested & linted to maintain code quality.
We ask that you run ```grunt``` in the base FreeDOM library to verify changes
before committing or submitting pull requests.

Internal docs are auto-generated [here](https://homes.cs.washington.edu/~wrs/tools/doc).
