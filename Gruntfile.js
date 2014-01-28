var FILES = {
  preamble: ['src/libs/*.js', 'src/util/preamble.js'],
  postamble: ['src/util/postamble.js'],
  src: [
    'src/*.js', 
    'src/proxy/*.js', 
    'interface/*.js', 
    'providers/core/*.js',
  ],
  jasminehelper: ['spec/util.js'],
  srcprovider: [
    'providers/social/websocket-server/*.js',
    'providers/storage/**/*.js',
    'providers/transport/**/*.js'
  ],
  specsrc: ['spec/src/**/*.spec.js', 'spec/providers/core/**/*.spec.js', 'spec/providers/storage/**/*.spec.js'],
  specproviders: ['spec/providers/transport/**/*.spec.js'],
};

module.exports = function(grunt) {
  var webserverprocess = null;
  var saucekey = null;  // Sauce User and API key must be provided by environment
  var sauceuser = null; // variables so that they are not made publicly available.
  if (typeof process.env.SAUCE_ACCESS_KEY !== "undefined") {
    saucekey = process.env.SAUCE_ACCESS_KEY;
  }
  if (typeof process.env.SAUCE_USER_NAME !== "undefined") {
    sauceuser = process.env.SAUCE_USER_NAME;
  }
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jasmine: {
      freedom: {
        src: FILES.src.concat(FILES.jasminehelper), 
        options: {
          specs: FILES.specsrc,
          keepRunner: false,
        }
      },
      freedomKeepRunner: {
        src: FILES.src.concat(FILES.jasminehelper), 
        options: {
          specs: FILES.specsrc,
          keepRunner: true,
        }
      },
      coverage: {
        src: FILES.src.concat(FILES.jasminehelper),
        options: {
          specs: FILES.specsrc,
          template: require('grunt-template-jasmine-istanbul'),
          templateOptions: {
            coverage: 'tools/lcov.info',
            report: [{type: 'lcovonly'}]
          }
        }
      },
    },
    'saucelabs-jasmine': {
      all: {
        options: {
          username: sauceuser,
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
      args: ['tools/chromeTestRunner.sh'].concat(grunt.file.expand(FILES.specsrc)),
    }, function done(error, result, code) {
      grunt.log.ok('Failed to execute shell script:'+
        "\n\t"+error+
        "\n\tResult: "+result+
        "\n\tCode: "+code);
    });
  });

  // Spawn and kill a web server to help with remote saucelabs testing
  grunt.registerTask('spawn-web-server', "Spawn a python webserver to serve the root dir", function(){
    webserverprocess = grunt.util.spawn({
      cmd: 'python',
      args: ['-m', 'SimpleHTTPServer'],
    }, function done(error, result, code) {
      grunt.log.error('Failed to execute shell script:'+
        "\n\t"+error+
        "\n\tResult: "+result+
        "\n\tCode: "+code);
      grunt.log.ok("\nIGNORE THIS ERROR IF YOU CAN ACCESS http://localhost:8000/_SpecRunner.html");
    });
  });
  grunt.registerTask('kill-web-server', "Kill the web server", function(){
    if(webserverprocess != null){
      webserverprocess.kill();
    }
  });

  // Default tasks.
  grunt.registerTask('freedom', [
    'jshint:beforeconcat',
    'concat',
    'jasmine:freedom',
    'jshint:afterconcat',
    'jshint:providers',
    'jshint:demo',
    'uglify'
  ]);
  grunt.registerTask('coverage', [
    'concat',
    'jasmine:coverage',
    'coveralls:report'
  ]);
  grunt.registerTask('saucelabs', [
    'jasmine:freedomKeepRunner',
    'spawn-web-server',
    'saucelabs-jasmine',
    'kill-web-server',
  ]);
  grunt.registerTask('default', ['freedom']);
};
