var FILES = {
  preamble: ['src/util/preamble.js'],
  postamble: ['src/util/postamble.js'],
  src: [
    'src/*.js', 
    'src/link/*.js',
    'src/proxy/*.js', 
    'interface/*.js', 
    'providers/core/*.js',
  ],
  jasminehelper: [
    'spec/util.js',
  ],
  srcprovider: [
    'providers/social/websocket-server/*.js',
    'providers/social/loopback/*.js',
    'providers/storage/**/*.js',
    'providers/transport/**/*.js'
  ],
  specunit: [
    'spec/src/**/*.spec.js', 
    'spec/providers/core/**/*.spec.js', 
    'spec/providers/social/**/*.unit.spec.js', 
    'spec/providers/storage/**/*.unit.spec.js',
//    'spec/providers/transport/**/*.unit.spec.js',
  ],
  specintegration: [
    'spec/providers/social/**/*.integration.spec.js',
    'spec/providers/storage/**/*.integration.spec.js',
    'spec/providers/transport/**/*.integration.spec.js',
  ],
  specall: ['spec/**/*.spec.js']
};
var WEBSERVER_PROCESS = null;

module.exports = function(grunt) {
  var saucekey = null;
  if (typeof process.env.SAUCE_ACCESS_KEY !== "undefined") {
    saucekey = process.env.SAUCE_ACCESS_KEY;
  }
  var jasmineSpecs = {};
  var jasmineTasks = [];
  var jasmineCoverageTasks = [];
  
  FILES.specunit.forEach(function(spec) {
    jasmineTasks.push('jasmine:' + spec);
    jasmineCoverageTasks.push('jasmine:' + spec + 'Coverage');
    jasmineSpecs[spec] = {
      src: FILES.src.concat(FILES.srcprovider).concat(FILES.jasminehelper),
      options: {
        specs: spec,
        keepRunner: false
      }
    };
    jasmineSpecs[spec + 'KeepRunner'] = {
      src: FILES.src.concat(FILES.srcprovider).concat(FILES.jasminehelper),
      options: {
        specs: spec,
        keepRunner: true
      }
    }
    jasmineSpecs[spec + 'Coverage'] = {
      src: FILES.src.concat(FILES.srcprovider).concat(FILES.jasminehelper),
      options: {
        specs: spec,
          template: require('grunt-template-jasmine-istanbul'),
          templateOptions: {
            coverage: 'tools/lcov.info',
            report: [{type: 'lcovonly'}]
          }
      }
    }
  });
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jasmine: jasmineSpecs,
    'saucelabs-jasmine': {
      all: {
        options: {
          username: 'daemonf',
          key: saucekey,
          urls: ['http://localhost:8000/_SpecRunner.html'],
          browsers: [
            {
              browserName: 'chrome',
            }
          ]
        } 
      }
    },
    jshint: {
      beforeconcat: FILES.src,
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
        mangle: { except: ['global'] }
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
        src: 'lcov.info'
      }
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

  grunt.registerTask('spawn-web-server', "Spawn a python webserver to serve the root dir", function(){
    WEBSERVER_PROCESS = grunt.util.spawn({
      cmd: 'python',
      args: ['-m', 'SimpleHTTPServer'],
    }, function done(error, result, code) {
      grunt.log.ok('Failed to execute shell script:'+
        "\n\t"+error+
        "\n\tResult: "+result+
        "\n\tCode: "+code);
    });
  });

  grunt.registerTask('kill-web-server', "Kill the web server", function(){
    if(WEBSERVER_PROCESS != null){
      WEBSERVER_PROCESS.kill();
    }
  });

  // Default tasks.
  grunt.registerTask('jasmineTasks', jasmineTasks);
  grunt.registerTask('jasmineCoverageTasks', jasmineCoverageTasks);
  grunt.registerTask('freedom', [
    'jshint:beforeconcat',
    'concat',
    'jasmineTasks',
    'jshint:afterconcat',
    'jshint:providers',
    'jshint:demo',
    'uglify'
  ]);
  grunt.registerTask('test', [
    'freedom',
    'chromeTestRunner'
  ]);
  grunt.registerTask('coverage', [
    'concat',
    'jasmineCoverageTasks',
    'coveralls:report'
  ]);
  grunt.registerTask('saucelabs', [
    'jasmineTasks',
    'spawn-web-server',
    'saucelabs-jasmine',
    'kill-web-server',
  ]);
  grunt.registerTask('default', ['freedom']);
};
