/*jslint node:true*/
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
 * release
 *  - Bump npm package patch version, tag the commit, and publish to npm
 *  - Compile YUIdocs and publish docs, demos, and dist to website
 **/

var FILES = {
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
    'spec/src/*.spec.js'
  ],
  specPlatformUnit: [
    'spec/providers/core/**/*.spec.js'
  ],
  specProviderUnit: [
    'spec/providers/social/**/*.unit.spec.js',
    'spec/providers/storage/**/*.unit.spec.js',
    'spec/providers/transport/**/*.unit.spec.js'
  ],
  specProviderIntegration: [
    'spec/providers/*.integration.spec.js',
    'spec/providers/storage/*.integration.spec.js'
  ],
  specAll: ['spec/**/*.spec.js'],
  freedom: [
    'freedom.js'
  ]
};

var CUSTOM_LAUNCHER = {
  sauce_chrome_mac: {
    base: 'SauceLabs',
    browserName: 'chrome',
    version: 'beta',
    platform: 'OS X 10.8'
  },
  sauce_chrome_win: {
    base: 'SauceLabs',
    browserName: 'chrome',
    version: 'dev',
    platform: 'Windows 7'
  },
  sauce_firefox: {
    base: 'SauceLabs',
    browserName: 'firefox',
    version: ''
  }
};

module.exports = function (grunt) {
  'use strict';
  /**
   * GRUNT CONFIG
   **/
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    karma: {
      options: {
        // NOTE: need to run 'connect:default' to serve files
        configFile: 'karma.conf.js',
        singleRun: true,
        autoWatch: false
      },
      browsers: {
        browsers: ['Chrome', 'Firefox']
      },
      phantom: {
        browsers: ['PhantomJS']
      },
      saucelabs: {
        browsers: ['sauce_chrome_mac', 'sauce_chrome_win', 'sauce_firefox'],
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
            '<%= gitinfo.local.branch.current.lastCommitTime %>'
          ]
        },
        customLaunchers: CUSTOM_LAUNCHER
      }
    },
    jshint: {
      beforeconcat: {
        files: { src: FILES.srcCore.concat(FILES.srcPlatform) }
      },
      grunt: ['Gruntfile.js'],
      providers: ['providers/**/*.js'],
      demo: ['demo/**/*.js', '!demo/**/third-party/**'],
      options: {
        jshintrc: true
      }
    },
    browserify: {
      freedom: {
        files: {
          'freedom.js': ['src/util/workerEntry.js']
        },
        options: {
          banner: require('fs').readFileSync('src/util/header.txt') +
              '/** Version: <%= pkg.version %> **/\n'
        }
      },
      frame: {
        files: {
          'spec/helper/frame.js': ['src/util/frameEntry.js']
        }
      },
      jasmine_unit: {
        files: {
          'spec.js': FILES.specCoreUnit.concat(
            FILES.specPlatformUnit,
            FILES.specProviderUnit
          )
        }
      },
      jasmine_coverage: {
        files: {
          'spec.js': FILES.specCoreUnit.concat(
            FILES.specPlatformUnit,
            FILES.specProviderUnit
          )
        },
        options: {
          transform: ['folderify', ['browserify-istanbul', {
            // Note: bundle must be ignored, 
            ignore: ['**/spec/**', '**/src/bundle.js']
          }]]
        }
      },
      jasmine_full: {
        files: {
          'spec.js': FILES.specCoreUnit.concat(
            FILES.specPlatformUnit,
            FILES.specProviderUnit,
            FILES.specProviderIntegration
          )
        }
      },
      options: {
        transform: ['folderify'],
        browserifyOptions: {
          debug: true
        }
      }
    },
    clean: ['freedom.js', 'freedom.js.map', 'freedom.min.js', 'freedom.min.js.map', 'spec.js', 'spec/helper/frame.js'],
    "extract_sourcemap": {
      freedom: {
        files: {
          "./": ["freedom.js"]
        }
      }
    },
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
    codeclimate: {
      options: {
        file: 'unset: use `grunt prepare_codeclimate` to set.',
        token: process.env.CODECLIMATETOKEN || 'unknown'
      }
    },
    connect: {
      freedom: {
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
          base: ["./", "demo/"],
          open: "http://localhost:8000/demo/"
        }
      }
    },
    gitinfo: {},
    bump: {
      options: {
        files: ['package.json', 'bower.json'],
        commit: true,
        commitMessage: 'Release v%VERSION%',
        commitFiles: ['package.json', 'bower.json'],
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
        abortIfDirty: true
      }
    },
    prompt: {
      tagMessage: {
        options: {
          questions: [
            {
              config: 'bump.options.tagMessage',
              type: 'input',
              message: 'Enter a git tag message:',
              default: 'v%VERSION%'
            }
          ]
        }
      }
    },
    shell: {
      options: {},
      publishWebsite: {
        command: 'bash tools/publishWebsite.sh'
      }
    }
  });

  // Load tasks.
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-bump');
  grunt.loadNpmTasks('grunt-codeclimate-reporter');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-yuidoc');
  grunt.loadNpmTasks('grunt-coveralls');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-extract-sourcemap');
  grunt.loadNpmTasks('grunt-gitinfo');
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-npm');
  grunt.loadNpmTasks('grunt-prompt');
  grunt.loadNpmTasks('grunt-shell');
  
  grunt.registerTask('prepare_watch', 'Run browserify and karma in watch mode.',
    function () {
      grunt.config.merge({
        browserify: {
          options: {
            debug: true,
            watch: true
          }
        },
        karma: {
          options: {
            singleRun: false,
            autoWatch: true,
            reporters: ['progress', 'html'],
            coverageReporter: {}
          }
        }
      });
    });
  grunt.registerTask('dynamic_codeclimate', 'Run codeclimate with correct lcov.',
    function () {
      var file = require("glob").sync("tools/coverage/PhantomJS**/lcov.info");
      if (file.length !== 1) {
        return grunt.log.error("lcov file not present or distinguishable for code climate");
      }
      require('fs').renameSync(file[0], "tools/coverage/lcov.info");
      grunt.config.merge({
        codeclimate: {
          report: {
            src: "tools/coverage/lcov.info",
            options: {
              file: "tools/coverage/lcov.info",
              token: process.env.CODECLIMATETOKEN
            }
          }
        }
      });
      grunt.task.run('codeclimate:report');
    });
  
  // Default tasks.
  grunt.registerTask('build', [
    'jshint',
    'browserify:freedom',
    'extract_sourcemap'
  ]);
  grunt.registerTask('unit', [
    'browserify:frame',
    'browserify:jasmine_unit',
    'connect:freedom',
    'karma:phantom'
  ]);
  grunt.registerTask('test', [
    'jshint',
    'browserify:frame',
    'browserify:jasmine_full',
    'connect:freedom',
    'karma:browsers'
  ]);
  grunt.registerTask('debug', [
    'prepare_watch',
    'jshint',
    'browserify:frame',
    'browserify:jasmine_full',
    'connect:freedom',
    'karma:browsers'
  ]);
  grunt.registerTask('demo', [
    'browserify:freedom',
    'connect:demo'
  ]);
  grunt.registerTask('website', [
    'yuidoc',
    'shell:publishWebsite'
  ]);

  if (process.env.TRAVIS_JOB_NUMBER) {
    var jobParts = process.env.TRAVIS_JOB_NUMBER.split('.');
    //When run from Travis from jobs *.1
    if (jobParts.length > 1 && jobParts[1] === '1') {
      grunt.registerTask('ci', [
        'browserify:frame',
        'browserify:jasmine_coverage',
        'connect:freedom',
        'karma:phantom',
        'gitinfo',
        'karma:saucelabs',
        'coveralls:report',
        'dynamic_codeclimate'
      ]);
    } else {  //When run from Travis from jobs *.2, *.3, etc.
      grunt.registerTask('ci', [
        'browserify:frame',
        'browserify:jasmine_unit',
        'connect:freedom',
        'karma:phantom'
      ]);
    }
  } else {  //When run from command-line
    grunt.registerTask('ci', [
      'browserify:frame',
      'browserify:jasmine_unit',
      'connect:freedom',
      'karma:phantom',
      'gitinfo',
      'karma:saucelabs'
    ]);
  }
  
  grunt.registerTask('release', function (arg) {
    if (arguments.length === 0) {
      arg = 'patch';
    }
    grunt.task.run([
      'default',
      'prompt:tagMessage',
      'bump:' + arg,
      'npm-publish',
      'website'
    ]);
  });

  grunt.registerTask('default', ['build', 'unit']);
};

module.exports.FILES = FILES;
module.exports.CUSTOM_LAUNCHER = CUSTOM_LAUNCHER;
