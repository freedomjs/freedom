// Karma configuration
// Generated on Fri May 09 2014 12:32:28 GMT-0700 (PDT)
var FILES = require('./Gruntfile').FILES

function bangFilter(elt) {
  if (elt.length > 0) { //Filter strings that start with '!'
    return elt.charAt(0) !== '!';
  } else { //Filter empty strings
    return false;
  }

}

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],


    // list of files / patterns to load in the browser
    files: FILES.src.concat(FILES.srcJasmineHelper).concat(FILES.specUnit).filter(bangFilter),

    // list of files to exclude
    exclude: FILES.karmaExclude,

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: FILES.src.reduce(function(prev, curr, i, arr) {
      prev[curr] = 'coverage';
      return prev;
    }, {}),

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress', 'coverage'],

    // Coverage report options
    coverageReporter: {
      type: 'lcovonly',
      dir: 'tools/coverage/',
      file: 'lcov.info'
    },

    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome', 'Firefox', 'PhantomJS'],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false
  });
};
