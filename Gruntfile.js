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

var promisePath = require.resolve('es6-promise');
var promisePrefix = promisePath.substr(0, promisePath.indexOf('es6-promise'));
var promiseSelector = [
  promisePrefix + '/es6-promise/dist/promise-*.js',
  '!' + promisePrefix + '/es6-promise/dist/promise-*amd.js',
  '!' + promisePrefix + '/es6-promise/dist/promise-*min.js'
];

var FILES = {
  lib: promiseSelector.concat([
    'src/util/jshinthelper.js'
  ]),
  srcJasmineHelper: promiseSelector.concat([
    require.resolve('es5-shim'),
    'spec/util.js'
  ]),
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
  srcProviderIntegration: [
    'spec/providers/social/**/*.integration.src.js',
    'spec/providers/storage/**/*.integration.src.js',
    'spec/providers/transport/**/*.integration.src.js'
  ],
  specProviderIntegration: [
    'spec/providers/social/**/*.integration.spec.js',
    'spec/providers/storage/**/*.integration.spec.js',
    'spec/providers/transport/**/*.integration.spec.js'
  ],
  srcProvider: [
    'providers/oauth/*.js',
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

function unGlob(arr) {
  var include = [], exclude = [];
  arr.filter(function(el) {
    if (el.length > 0 && el.charAt(0) !== '!') {
      include.push(el);
    } else if (el.length > 0) {
      exclude.push(el.substr(1));
    }
  });
  return {include: include, exclude: exclude};
}

module.exports = function (grunt) {
  /**
   * GRUNT CONFIG
   **/
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    karma: {
      options: {
        // NOTE: need to run 'connect:default' to serve files
        configFile: 'karma.conf.js',
      },
      single: { singleRun: true, autoWatch: false },
      watch: { singleRun: false, autoWatch: true },
      phantom: { 
        exclude: unGlob(FILES.srcJasmineHelper).exclude.concat(
          FILES.specProviderIntegration
        ),
        browsers: ['PhantomJS'], 
        singleRun: true, 
        autoWatch: false
      },
      saucelabs: {
        exclude: unGlob(FILES.srcJasmineHelper).exclude.concat(
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
          sourceMapIn: 'freedom.js.map'
        }
      }
    },
    clean: ['freedom.js', 'freedom.js.map', 'freedom.min.js', 'freedom.min.js.map'],
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
    gitinfo: {},
    bump: {
      options: {
        files: ['package.json'],
        commit: true,
        commitMessage: 'Release v%VERSION%',
        commitFiles: ['package.json'],
        createTag: true,
        tagName: 'v%VERSION%',
        tagMessage: 'Version %VERSION%',
        push: true,
        pushTo: 'origin'
      }
    },
    'npm-publish': {
      options: {
        // list of tasks that are required before publishing
        requires: [],
        // if the workspace is dirty, abort publishing (to avoid publishing local changes)
        abortIfDirty: true,
      }
    }

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
  grunt.loadNpmTasks('grunt-bump');
  grunt.loadNpmTasks('grunt-npm');
  
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
  
  grunt.registerTask('release', function(arg) {
    if (arguments.length === 0) {
      arg = 'patch';
    }
    grunt.task.run([
      'default',
      'bump:'+arg,
      'npm-publish'
    ]);
  });


  grunt.registerTask('default', ['build', 'karma:phantom']);
};

module.exports.FILES = FILES;
module.exports.CUSTOM_LAUNCHER = CUSTOM_LAUNCHER;
module.exports.unGlob = unGlob;
