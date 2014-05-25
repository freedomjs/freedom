// Karma configuration
// Generated on Fri May 09 2014 12:32:28 GMT-0700 (PDT)
var FILES = require('./Gruntfile').FILES;
var bangFilter = require('./Gruntfile').bangFilter;

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],

    // list of files / patterns to load in the browser
    // Testing Providers for now
    files: [].concat(
      FILES.srcCore,
      FILES.srcPlatform,
      FILES.srcJasmineHelper,
      FILES.specCoreUnit,
      FILES.specPlatformUnit,
      FILES.srcProvider,
      FILES.specProviderUnit,
      FILES.specProviderIntegration
    ).filter(bangFilter),

    // list of files to exclude
    exclude: FILES.karmaExclude,
    
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
    reporters: ['progress', 'coverage', 'saucelabs', 'unicorn', 'story'],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: [].concat(
      FILES.srcCore, 
      FILES.srcPlatform,
      FILES.srcProvider
    ).reduce(function(prev, curr, i, arr) {
      prev[curr] = 'coverage';
      return prev;
    }, {}),
    
    // Coverage report options
    coverageReporter: {
      type: 'lcovonly',
      dir: 'tools/coverage/',
      file: 'lcov.info'
    },

    // SauceLabs config that gets overwritten in Gruntfile.js
    sauceLabs: {},
    customLaunchers: {},
  });
};
