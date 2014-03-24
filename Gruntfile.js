/**
 * Gruntfile for freedom.js
 *
 * Here are the common tasks used:
 * freedom
 *  - Lint, compile, and unit test freedom.js
 *  - (default Grunt task) 
 * test
 *  - In addition to the freedom task,
 *    run all phantomjs-compatible tests
 * debug
 *  - Host a local web server
 *    Run all tests by going to http://localhost:8000/_SpecRunner.html
 * saucelabs
 *  - Run all tests on saucelabs.com
 * chromeTestRunner
 *  - Run all tests in a local Chrome app
 **/

var FILES = {
  preamble: [
    'src/util/preamble.js',
    'node_modules/es6-promise/dist/promise-*.js',
    '!node_modules/es6-promise/dist/promise-*amd.js',
    '!node_modules/es6-promise/dist/promise-*min.js',
    'src/util/jshinthelper.js',
  ],
  postamble: ['src/util/postamble.js'],
  src: [
    'src/*.js', 
    'src/link/*.js',
    'src/proxy/*.js', 
    'interface/*.js', 
    'providers/core/*.js',
  ],
  jasminehelper: [
    'node_modules/es6-promise/dist/promise-*.js',
    '!node_modules/es6-promise/dist/promise-*amd.js',
    '!node_modules/es6-promise/dist/promise-*min.js',
    'spec/util.js',
  ],
  srcprovider: [
    'providers/social/websocket-server/*.js',
    'providers/social/loopback/*.js',
    'providers/storage/**/*.js',
    'providers/transport/**/*.js'
  ],
  specunit: [
    'spec/src/{a,b,c,d,e}*.spec.js',
    'spec/src/{f,g}*.spec.js',
    'spec/src/{h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z}*.spec.js',
    'spec/providers/core/**/*.spec.js', 
    'spec/providers/social/**/*.unit.spec.js', 
    'spec/providers/storage/**/*.unit.spec.js',
    'spec/providers/transport/**/*.unit.spec.js',
  ],
  specintegration: [
    'spec/providers/social/**/*.integration.spec.js',
    'spec/providers/storage/**/*.integration.spec.js',
    'spec/providers/transport/**/*.integration.spec.js',
  ],
  specintegrationphantom: [
    'spec/providers/social/**/*.integration.spec.js',
    'spec/providers/storage/**/*.integration.spec.js',
  ],
  specall: ['spec/**/*.spec.js']
};

module.exports = function(grunt) {
  var jasmineSpecs = {};
  var jasmineUnitTasks = [];
  var jasmineIntegrationTasks = [];
  var jasmineCoverageTasks = [];

  /**
   * Helper functions
   **/
  function generatePhantomTask(spec) {
    return {
      src: FILES.src.concat(FILES.srcprovider).concat(FILES.jasminehelper),
      options: {
        specs: spec,
        keepRunner: false 
      }
    };
  }

  function generateCoverageTask(spec) {
    return {
      src: FILES.src.concat(FILES.srcprovider).concat(FILES.jasminehelper),
      options: {
        specs: spec,
        template: require('grunt-template-jasmine-istanbul'),
        templateOptions: {
          coverage: 'tools/coverage' + jasmineCoverageTasks.length + '.json',
          report: []
        }
      }
    };
  }
  
  /**
   * Setup Jasmine tests
   **/
  FILES.specunit.forEach(function(spec) {
    var sname = spec + 'Spec';
    jasmineUnitTasks.push('jasmine:' + sname);
    jasmineCoverageTasks.push('jasmine:' + sname + 'Coverage');
    jasmineSpecs[sname] = generatePhantomTask(spec);
    jasmineSpecs[sname + 'Coverage'] = generateCoverageTask(spec);
  });
  FILES.specintegrationphantom.forEach(function(spec) {
    var sname = spec + "Spec";
    jasmineIntegrationTasks.push("jasmine:"+sname);
    jasmineSpecs[sname] = generatePhantomTask(spec);
  });
  jasmineSpecs["all"] = generatePhantomTask(FILES.specall[0]);

  /**
   * GRUNT CONFIG
   **/
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jasmine: jasmineSpecs,
    'saucelabs-jasmine': {
      all: {
        options: {
          username: 'freedomjs',
          key: process.env.SAUCEKEY,
          urls: ['http://localhost:8000/_SpecRunner.html'],
          testname: 'freedom.js',
          tags: [
            '<%= gitinfo.local.branch.current.name %>',
            '<%= gitinfo.local.branch.current.shortSHA %>',
            '<%= gitinfo.local.branch.current.currentUser %>',
            '<%= gitinfo.local.branch.current.lastCommitAuthor %>',
            '<%= gitinfo.local.branch.current.lastCommitTime %>',
          ],
          browsers: [
            {
              browserName: 'chrome',
              version: '33',
            }
          ]

        } 
      }
    },
    jshint: {
      beforeconcat: {
        files: { src: FILES.src },
        options: {
          jshintrc: true
        }
      },
      afterconcat: ['freedom.js'],
      providers: FILES.srcprovider,
      demo: ['demo/**/*.js'],
      options: {
        '-W069': true
      }
    },
    concat: {
      dist: {
        options: {
          process: function(src) {
            return src.replace(/\/\*jslint/g,'/*');
          }
        },
        src: FILES.preamble.concat(FILES.src).concat(FILES.postamble),
        dest: 'freedom.js'
      }
    },
    uglify: {
      options: {
        mangle: { except: ['global'] },
        preserveComments: 'some'
      },
      freedom: {
        files: {
          'freedom.min.js': ['freedom.js']
        }
      }
    },
    clean: ['freedom.js', 'freedom.min.js'],
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
        src: 'tools/lcov.info'
      }
    },
    connect: {
      server: {
        options: {
          port: 8000,
          keepalive: false
        }
      },
      serverpersist: {
        options: {
          port: 8000,
          keepalive: true
        }
      }
    },
    gitinfo: {
    }
  });

  // Load tasks.
  grunt.loadNpmTasks('grunt-contrib-jasmine');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-yuidoc');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-coveralls');
  grunt.loadNpmTasks('grunt-saucelabs');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-gitinfo');
  
  // Write lcov coverage
  grunt.registerTask('istanbulCollect', "Collects test coverage", function() {
    var istanbul = require('istanbul');
    var collector = new istanbul.Collector();
    var reporter = istanbul.Report.create('lcovonly', {
      dir: 'tools'
    });
    grunt.file.expand('tools/coverage*.json').forEach(function (file) {
      collector.add(grunt.file.readJSON(file));
    });
    reporter.writeReport(collector, true);
  });

  // Custom Task for Chrome Test Runner
  grunt.registerTask('chromeTestRunner', "Runs tests in a Chrome App", function(){
    grunt.util.spawn({
      cmd: 'bash',
      args: ['tools/chromeTestRunner.sh'].concat(grunt.file.expand(FILES.specall)),
    }, function done(error, result, code) {
      grunt.log.ok('Failed to execute shell script:'+
        "\n\t"+error+
        "\n\tResult: "+result+
        "\n\tCode: "+code);
    });
  });

  // Default tasks.
  grunt.registerTask('jasmineUnitTasks', jasmineUnitTasks);
  grunt.registerTask('jasmineIntegrationTasks', jasmineIntegrationTasks);
  grunt.registerTask('jasmineCoverageTasks', jasmineCoverageTasks);
  grunt.registerTask('freedom', [
    'jshint:beforeconcat',
    'concat',
    'jasmineUnitTasks',
    'jshint:afterconcat',
    'jshint:providers',
    'jshint:demo',
    'uglify'
  ]);
  grunt.registerTask('test', [
    'freedom',
    'jasmineIntegrationTasks'
  ]);
  grunt.registerTask('coverage', [
    'concat',
    'jasmineCoverageTasks',
    'istanbulCollect',
    'coveralls:report'
  ]);
  grunt.registerTask('debug', [
    'jasmine:all:build',
    'connect:serverpersist',
  ]);
  grunt.registerTask('saucelabs', [
    'gitinfo',
    'jasmine:all:build',
    'connect:server',
    'saucelabs-jasmine',
  ]);
  grunt.registerTask('default', ['freedom']);
};

module.exports.FILES = FILES;
