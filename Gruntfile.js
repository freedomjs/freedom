/**
 * Gruntfile for freedom.js
 *
 * Here are the common tasks used:
 * build
 *  - Lint and compile freedom.js
 *  - (default Grunt task) 
 *  - This must be run before ANY karma task (because of connect:default)
 *  - Unit tests only run on PhantomJS
 * demo
 *  - Build freedom.js, and start a web server for seeing demos at
 *    http://localhost:8000/demo
 * test
 *  - Build freedom.js, and run all unit tests on 
 *    Chrome, Firefox, and PhantomJS
 * debug
 *  - Same as test, except keeps the browsers open 
 *    and reruns tests on watched file changes.
 *  - Used to debug unit tests
 * ci
 *  - Do everything that Travis CI should do
 *  - Lint, compile, and unit test freedom.js on phantom.js
 *  - Run all tests on saucelabs.com
 *  - Report coverage to coveralls.io
 **/

var FILES = {
  lib: [
    'node_modules/es6-promise/dist/promise-*.js',
    '!node_modules/es6-promise/dist/promise-*amd.js',
    '!node_modules/es6-promise/dist/promise-*min.js',
    'src/util/jshinthelper.js'
  ],
  srcJasmineHelper: [
    'node_modules/es6-promise/dist/promise-*.js',
    '!node_modules/es6-promise/dist/promise-*amd.js',
    '!node_modules/es6-promise/dist/promise-*min.js',
    'node_modules/es5-shim/es5-shim.js',
    'spec/util.js'
  ],
  srcCore: [
    'src/*.js',
    'src/link/*.js',
    'src/proxy/*.js',
    'interface/*.js'
  ],
  srcPlatform: [
    'providers/core/*.js'
  ],
  specCoreUnit: [
    'spec/src/{a,b,c,d,e}*.spec.js',
    'spec/src/{f,g}*.spec.js',
    'spec/src/{h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z}*.spec.js'
  ],
  specPlatformUnit: [
    'spec/providers/core/**/*.spec.js'
  ],
  //Integration tests
  specProviderIntegration: [
    'spec/providers/social/**/*.integration.spec.js',
    'spec/providers/storage/**/*.integration.spec.js',
    'spec/providers/transport/**/*.integration.spec.js'
  ],
  srcProvider: [
    'providers/social/websocket-server/*.js',
    'providers/social/loopback/*.js',
    'providers/storage/**/*.js',
    'providers/transport/**/*.js'
  ],
  specProviderUnit: [
    'spec/providers/social/**/*.unit.spec.js',
    'spec/providers/storage/**/*.unit.spec.js',
    'spec/providers/transport/**/*.unit.spec.js'
  ],
  //Other
  karmaExclude: [
    'node_modules/es6-promise/dist/promise-*amd.js',
    'node_modules/es6-promise/dist/promise-*min.js'
  ],
  specAll: ['spec/**/*.spec.js'],
  freedom: [
    'freedom.js'
  ]
};

var CUSTOM_LAUNCHER = {
  sauce_chrome_34: {
    base: 'SauceLabs',
    browserName: 'chrome',
    version: '34',
    platform: 'OS X 10.9'
  },
  sauce_chrome_33: {
    base: 'SauceLabs',
    browserName: 'chrome',
    version: '33',
    platform: 'Windows 7'
  },
  sauce_firefox: {
    base: 'SauceLabs',
    browserName: 'firefox',
    version: '29'
  }
};

function bangFilter(elt) {
  if (elt.length > 0) { //Filter strings that start with '!'
    return elt.charAt(0) !== '!';
  } else { //Filter empty strings
    return false;
  }
}

module.exports = function (grunt) {
  /**
   * GRUNT CONFIG
   **/
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    karma: {
      options: {
        configFile: 'karma.conf.js',
        // NOTE: need to run 'connect:keepalive' to serve files
        proxies:  {'/': 'http://localhost:8000/'},
      },
      single: { singleRun: true, autoWatch: false },
      watch: { singleRun: false, autoWatch: true },
      phantom: { 
        exclude: [].concat(
          FILES.karmaExclude,
          FILES.specProviderIntegration
        ),
        browsers: ['PhantomJS'], 
        singleRun: true, 
        autoWatch: false
      },
      saucelabs: {
        exclude: [].concat(
          FILES.karmaExclude,
          FILES.specProviderIntegration
        ),
        browsers: ['sauce_chrome_34', 'sauce_chrome_33'],//, 'sauce_firefox'],
        singleRun: true,
        autoWatch: false,
        reporters: ['dots', 'saucelabs'],
        sauceLabs: {
          testName: 'freedom.js',
          username: 'freedomjs',
          accessKey: process.env.SAUCEKEY,
          build: process.env.TRAVIS_BUILD_NUMBER,
          tags: [
            '<%= gitinfo.local.branch.current.name %>',
            '<%= gitinfo.local.branch.current.shortSHA %>',
            '<%= gitinfo.local.branch.current.currentUser %>',
            '<%= gitinfo.local.branch.current.lastCommitAuthor %>',
            '<%= gitinfo.local.branch.current.lastCommitTime %>',
          ],
        },
        customLaunchers: CUSTOM_LAUNCHER
      }
    },
    jshint: {
      beforeconcat: {
        files: { src: FILES.srcCore.concat(FILES.srcPlatform) },
        options: {
          jshintrc: true
        }
      },
      providers: FILES.srcProvider,
      demo: ['demo/**/*.js', '!demo/**/third-party/**'],
      options: {
        '-W069': true
      }
    },
    uglify: {
      freedom: {
        files: {
          'freedom.js': FILES.lib.concat(FILES.srcCore).concat(FILES.srcPlatform)
        },
        options: {
          sourceMap: true,
          mangle: false,
          beautify: true,
          preserveComments: function(node, comment) {
            return comment.value.indexOf('jslint') !== 0;
          },
          banner: require('fs').readFileSync('src/util/preamble.js', 'utf8'),
          footer: require('fs').readFileSync('src/util/postamble.js', 'utf8')
        }
      },
      min: {
        files: {
          'freedom.min.js': ['freedom.js']
        },
        options: {
          mangle: { except: ['global'] },
          preserveComments: 'some',
          sourceMap: true,
          sourceMapIn: 'freedom.map'
        }
      }
    },
    clean: ['freedom.js', 'freedom.map', 'freedom.min.js', 'freedom.min.map'],
    yuidoc: {
      compile: {
        name: '<%= pkg.name %>',
        description: '<%= pkg.description %>',
        version: '<%= pkg.version %>',
        options: {
          paths: 'src/',
          outdir: 'tools/doc/'
        }
      }
    },
    coveralls: {
      report: {
        src: 'tools/coverage/PhantomJS**/*lcov.info'
      }
    },
    connect: {
      default: {
        options: {
          port: 8000,
          keepalive: false
        }
      },
      keepalive: {
        options: {
          port: 8000,
          keepalive: true
        }
      },
      demo: {
        options: {
          port: 8000,
          keepalive: true,
          base: ["./","demo/"],
          open: "http://localhost:8000/demo/"
        }
      }
    },
    gitinfo: {}
  });

  // Load tasks.
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-yuidoc');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-coveralls');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-gitinfo');
  grunt.loadNpmTasks('grunt-karma');
  
  // Default tasks.
  grunt.registerTask('build', [
    'jshint',
    'uglify',
    'gitinfo',
    'connect:default'
  ]);
  grunt.registerTask('test', [
    'build',
    'karma:single'
  ]);
  grunt.registerTask('debug', [
    'build',
    'karma:watch'
  ]);
  grunt.registerTask('demo', [
    'uglify',
    'connect:demo',
  ]);

  if (process.env.TRAVIS_JOB_NUMBER) {
    var jobParts = process.env.TRAVIS_JOB_NUMBER.split('.');
    //When run from Travis from jobs *.1
    if (jobParts.length > 1 && jobParts[1] == '1') {
      grunt.registerTask('ci', [
        'build',
        'karma:phantom',
        'karma:saucelabs',
        'coveralls:report'
      ]);
    } else {  //When run from Travis from jobs *.2, *.3, etc.
      grunt.registerTask('ci', [
        'build',
        'karma:phantom'
      ]);
    }
  } else {  //When run from command-line
    grunt.registerTask('ci', [
      'build',
      'karma:phantom',
      'karma:saucelabs',
    ]);
  }

  grunt.registerTask('default', ['build', 'karma:phantom']);
};

module.exports.baseName = __dirname;
module.exports.FILES = FILES;
module.exports.CUSTOM_LAUNCHER = CUSTOM_LAUNCHER;
module.exports.bangFilter = bangFilter;
