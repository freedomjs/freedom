freedom.js
=======
[![Build Status](https://travis-ci.org/freedomjs/freedom.png?branch=master)](https://travis-ci.org/freedomjs/freedom)
[![Build Status](https://api.shippable.com/projects/54c823bf5ab6cc135289fbd6/badge?branchName=master)](https://app.shippable.com/projects/54c823bf5ab6cc135289fbd6/builds/latest)
[![Coverage Status](https://coveralls.io/repos/freedomjs/freedom/badge.png?branch=master)](https://coveralls.io/r/freedomjs/freedom?branch=master)
[![Code Climate](https://codeclimate.com/github/freedomjs/freedom/badges/gpa.svg)](https://codeclimate.com/github/freedomjs/freedom)
[![Selenium Test Status](https://saucelabs.com/browser-matrix/freedomjs.svg)](https://saucelabs.com/u/freedomjs)

freedom.js is a framework for building peer-to-peer (P2P) web apps. 
freedom.js makes it easy to quickly create social interactive applications that 
instantly work in modern web browsers, Chrome packaged apps, Firefox extensions, 
node.js, and native mobile apps. Because freedom.js
apps are just JavaScript, they can be distributed as packages on an app store or
hosted on static web servers. We're bringing peer-to-peer back, baby.

freedom.js comes with a tested set of implementations for storage, 
network communication, and navigating the social graph. 
The library exposes an architecture allowing you to build, think about, 
and debug your application from the perspective of a single user.

Use freedom.js
---------

If you want a built version of freedom.js into your website, grab a copy from our CDN:

Websites: 
* [freedom.latest.js](http://www.freedomjs.org/dist/freedom/latest/freedom.js) (unstable)
* [freedom.v0.6.19.js](http://www.freedomjs.org/dist/freedom/v0.6.19/freedom.v0.6.19.js) (stable)

Chrome Apps:
* [freedom-for-chrome.latest.js](http://www.freedomjs.org/dist/freedom-for-chrome/freedom-for-chrome.latest.js) (unstable)
* [freedom-for-chrome.v0.4.12.js](http://www.freedomjs.org/dist/freedom-for-chrome/freedom-for-chrome.v0.4.12.js) (stable)

Firefox Extensions:
* [freedom-for-firefox.latest.jsm](http://www.freedomjs.org/dist/freedom-for-firefox/freedom-for-firefox.latest.jsm) (unstable)
* [freedom-for-firefox.v0.6.8.jsm](http://www.freedomjs.org/dist/freedom-for-firefox/freedom-for-firefox.v0.6.8.jsm) (stable)

freedom, freedom-for-node, freedom-for-chrome, and freedom-for-firefox also exist as npm packages

    npm install freedom
    npm install freedom-for-node
    npm install freedom-for-chrome
    npm install freedom-for-firefox

To track progress of freedom.js for other platforms, check out these other repositories:
* [freedom-for-node](https://github.com/freedomjs/freedom-for-node) - Node.js apps
* [freedom-for-chrome](https://github.com/freedomjs/freedom-for-chrome) - Chrome Packaged Apps
* [freedom-for-firefox](https://github.com/freedomjs/freedom-for-firefox) - Firefox extensions

More documentation for building freedom.js, and including it in your project is
on our GitHub [wiki](https://github.com/freedomjs/freedom/wiki).

See freedom.js
-------

[Demos](http://www.freedomjs.org/dist/freedom/latest/demo/) show many of the common freedom.js patterns.

To run the demonstrations locally, run ```grunt demo```.

NOTE: freedom.js will not work when included as a ```file://``` URL (since reading from other file protocol URLs is disallowed). 
freedom.js is being developed against current versions of Chrome and Firefox.

Build freedom.js
---------

To create your own freedom.js, run [```grunt```](http://gruntjs.com) in the main repository.  This will compile, lint, unit test, and optionally compress the code base. freedom.js can also be included in your project as an NPM dependency:

    npm install freedom --save

Other helpful grunt commands:
* ```grunt freedom``` - Build freedom.js and run phantomjs unit tests
* ```grunt demo``` - Build and run demos
* ```grunt test``` - Run unit tests in Chrome and Firefox
* ```grunt debug``` - Build all tests and launch a webserver. freedom.js unit and integration tests can then be run by navigating to http://localhost:8000/_SpecRunner.html

Help freedom.js
---------

We welcome contributions and pull requests! A set of current issues are maintained in the issues section of this repository. In addition, we would be happy to help you work through bugs with your use of the library and suggest solutions on our mailing list ([freedom@cs.washington.edu](mailto:freedom@cs.washington.edu)).

Pull requests are automatically reviewed by travis to verify code quality and unit tests. You can predict that a pull request will fail if running ```grunt test``` locally fails.

Internal documentation for the library is [automatically generated](http://freedomjs.org/docs/master/doc/) and provides a reasonable starting point for understanding the internals of freedom.js.
