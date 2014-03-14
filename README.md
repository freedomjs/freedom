freedom.js
=======
[![Build Status](https://travis-ci.org/freedomjs/freedom.png?branch=master)](https://travis-ci.org/freedomjs/freedom)
[![Coverage Status](https://coveralls.io/repos/freedomjs/freedom/badge.png?branch=master)](https://coveralls.io/r/freedomjs/freedom?branch=master)

freedom.js is a runtime for distributed web applications

Building distributed systems is hard! Debugging machines out of your control
or in states you don't fully understand is miserable. Trust us.

The freedom.js library gives you the benefits of distribution without the headaches. freedom.js comes with a tested set of implementations for storage, communication, and navigating the social graph. The library exposes an architecture allowing you to build, think about, and debug your application from the perspective of a single user.

Use freedom.js
---------

If you want to drop freedom.js into your website, grab the copy [here](http://freedomjs.org/release/v0.4/freedom.latest.js).

If you want to use freedom.js in a privileged extension, look at our packages for [chrome](https://github.com/freedomjs/freedom-runtime-chrome) and firefox (soon).

If you want to use freedom.js in a node.js application, look at our [node runtime](https://github.com/freedomjs/freedom-runtime-node).

If you want to include freedom.js in your build process, run ```npm install freedom```.

More documentation for building freedom.js, and including it in your project is
on our github [wiki](https://github.com/freedomjs/freedom/wiki).

See freedom.js
-------

[Demos](http://freedomjs.org/demo/) show many of the common freedom.js patterns.

To run the demonstrations locally, first [build freedom.js](#build-freedomjs).  freedom.js will not work when included as a ```file://``` URL (since reading from other file protocol URLs is disallowed). Instead, we recommend running ```python -m SimpleHTTPServer``` to access your page via a local HTTP URL.

freedom.js is being developed against current versions of Chrome and Firefox.

Build freedom.js
---------

To create your own freedom.js, run [```grunt```](http://gruntjs.com) in the main repository.  This will compile, lint, unit test, and optionally compress the code base. freedom.js can also be included in your project as an NPM dependency:

    npm install freedom --save

Help freedom.js
---------

We welcome contributions and pull requests! A set of current issues are maintained in the issues section of this repository. In addition, we would be happy to help you work through bugs with your use of the library and suggest solutions on our mailing list ([freedom@cs.washington.edu](mailto:freedom@cs.washington.edu)).

Pull requests are automatically reviewed by travis to verify code quality and unit tests. You can predict that a pull request will fail if running ```grunt test``` locally fails.

Internal documentation for the library is [automatically generated](http://freedomjs.org/docs/master/doc/) and provides a reasonable starting point for understanding the internals of freedom.js.
