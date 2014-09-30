/*jslint node:true */
var FILES = require('./Gruntfile').FILES;

var locate_promises = function () {
  'use strict';
  var includer = require.resolve('es6-promise'),
    base = includer.substr(0, includer.lastIndexOf('es6-promise'));
  return base + 'es6-promise/dist/promise-1.0.0.js';
};

module.exports = function (config) {
  'use strict';
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],

    // list of files / patterns to load in the browser
    // Testing Providers for now
    files: [
      require.resolve('es5-shim'),
      locate_promises(),
      'spec.js',
      {pattern: 'spec/helper/frame.js', included: false}
    ],
    
    // web server port
    port: 9876,
    proxies:  {'/': 'http://localhost:8000/'},

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome', 'Firefox'],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,
    
    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress', 'html', 'coverage', 'saucelabs', 'unicorn', 'story'],
    
    // Coverage report options
    coverageReporter: {
      type: 'lcovonly',
      dir: 'tools/coverage/',
      file: 'lcov.info'
    },

    // SauceLabs config that gets overwritten in Gruntfile.js
    sauceLabs: {},
    customLaunchers: {}
  });
};
