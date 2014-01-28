freedom.js
=======
[![Build Status](https://travis-ci.org/UWNetworksLab/freedom.png?branch=master)](https://travis-ci.org/UWNetworksLab/freedom)
[![Coverage Status](https://coveralls.io/repos/UWNetworksLab/freedom/badge.png)](https://coveralls.io/r/UWNetworksLab/freedom)

freedom.js is a runtime for distributed web applications

Building distributed systems is hard! Debugging machines out of your control
or in states you don't fully understand is accompanied by a plethora of potential missteps.

The freedom.js runtime gives you the benefits of distribution without the headaches. The runtime comes with a solid set of service implementations
for storage, communication, and navigating a social graph, and an architecture to allow building, thinking about, and debugging your application from the perspective of a single user.

Use freedom.js
---------

A generated one-file version of freedom.js is maintained [here](https://homes.cs.washington.edu/~wrs/freedom.js).

Documentation for generating freedom.js yourself, or including it in your project, is maintained
on the github [wiki](https://github.com/UWNetworksLab/freedom/wiki).

See freedom.js
-------

Several demonstrations of the freedom.js library are available as included [```demos```](https://homes.cs.washington.edu/~wrs/demo/).

To run the demonstrations locally, freedom.js must be [generated](#build-freedomjs) on your machine.  Note that the freedom.js library cannot work when included as a ```file://``` URL (where xhr requests are not allowed by browser security policies). For testing locally, we recommend running ```python -m SimpleHTTPServer``` to access your page via a local HTTP URL.

Note: FreeDOM has only been tested using Chrome and Firefox.
Other browsers may experience issues.

Build freedom.js
---------

You can get started with freedom.js by using the generated version linked above. If you want to bundle freedom.js with custom providers, or otherwise need to generate your own version, run [```grunt```](http://gruntjs.com) in the main repository.  This will compile, lint, unit test, and optionally compress the code base. freedom.js can also be included in your project as an NPM dependency:

    npm install freedom --save-dev

Help freedom.js
---------

We welcome contributions and pull requests! A set of current issues are maintained in the issues section of this repository. In addition, we would be happy to help you work through bugs with your use of the library and suggest solutions on our mailing list ([freedom@cs.washington.edu](mailto:freedom@cs.washington.edu)).

Pull requests are automatically reviewed by travis to verify code quality and unit tests. You can predict that a pull request will fail if running ```grunt``` locally fails.

Internal documentation for the library is also [automatically generated](https://homes.cs.washington.edu/~wrs/tools/doc) and provides a reasonable starting point for understanding how the internals of freedom.js work together.
