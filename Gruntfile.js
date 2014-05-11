/**
 * Gruntfile for freedom.js
 *
 * Here are the common tasks used:
 * freedom
 *  - Lint, compile, and unit test freedom.js
 *  - (default Grunt task) 
 *  - Unit tests only run on PhantomJS
 * demo
 *  - Build freedom.js, and start a web server for seeing demos at
 *    http://localhost:8000/demo
 * debug
 *  - Host a local web server
 *  - Karma watches for file changes and reports unit test failures on
 *    Chrome and Firefox
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
    'src/util/jshinthelper.js',
  ],
  src: [
    'src/*.js', 
    'src/link/*.js',
    'src/proxy/*.js', 
    'interface/*.js', 
    'providers/core/*.js',
  ],
  srcJasmineHelper: [
    'node_modules/es6-promise/dist/promise-*.js',
    '!node_modules/es6-promise/dist/promise-*amd.js',
    '!node_modules/es6-promise/dist/promise-*min.js',
    'node_modules/es5-shim/es5-shim.js',
    'spec/util.js',
  ],
  specUnit: [
    'spec/src/{a,b,c,d,e}*.spec.js',
    'spec/src/{f,g}*.spec.js',
    'spec/src/{h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z}*.spec.js',
    'spec/providers/core/**/*.spec.js', 
  ],
  specProviderIntegration: [
    'spec/providers/social/**/*.integration.spec.js',
    'spec/providers/storage/**/*.integration.spec.js',
    'spec/providers/transport/**/*.integration.spec.js',
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
    'spec/providers/transport/**/*.unit.spec.js',
  ],
  karmaExclude: [
    'node_modules/es6-promise/dist/promise-*amd.js',
    'node_modules/es6-promise/dist/promise-*min.js',
  ],
  specAll: ['spec/**/*.spec.js']
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
  },
};

module.exports = function(grunt) {
  /**
   * GRUNT CONFIG
   **/
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    karma: {
      options: {
        configFile: 'karma.conf.js',
        browsers: ['Chrome', 'Firefox'],
        // NOTE: need to run 'connect:keepalive' to serve files
        proxies:  {
          '/': 'http://localhost:8000/',
        },
      },
      single: {
        singleRun: true,
        autoWatch: false,
      },
      watch: {
        singleRun: false,
        autoWatch: true,
      },
      phantom: {
        browsers: ['PhantomJS'],
        singleRun: true,
        autoWatch: false
      },
      saucelabs: {
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
        files: { src: FILES.src },
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
          'freedom.js': FILES.lib.concat(FILES.src)
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
  grunt.registerTask('freedom', [
    'jshint',
    'uglify',
    'gitinfo',
    'connect:default',
    'karma:phantom'
  ]);
  grunt.registerTask('debug', [
    'connect:default',
    'karma:watch'
  ]);
  grunt.registerTask('demo', [
    'uglify',
    'connect:demo',
  ]);

  if (process.env.TRAVIS_JOB_NUMBER) {
    var jobParts = process.env.TRAVIS_JOB_NUMBER.split('.');
    console.log("!!!!!!!!");
    console.log(jobParts);
    //When run from Travis from jobs *.1
    if (jobParts.length > 1 && jobParts[1] == '1') {
      console.log("!!!!!!!!");
      grunt.registerTask('ci', [
        'freedom',
        'karma:saucelabs',
        'coveralls:report'
      ]);
    } else {  //When run from Travis from jobs *.2, *.3, etc.
      console.log("@@@@@");
      grunt.registerTask('ci', [
        'freedom'
      ]);
    }
  } else {  //When run from command-line
    console.log("########");
    grunt.registerTask('ci', [
      'freedom',
      'karma:saucelabs',
    ]);
  }

  grunt.registerTask('default', ['freedom']);
};

module.exports.FILES = FILES;
module.exports.CUSTOM_LAUNCHER = CUSTOM_LAUNCHER;
