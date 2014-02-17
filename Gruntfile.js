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
    //'spec/providers/transport/**/*.integration.spec.js',
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
  var jasmineUnitTasks = [];
  var jasmineIntegrationTasks = [];
  var jasmineCoverageTasks = [];
  
  FILES.specunit.forEach(function(spec) {
    var sname = spec + 'Spec';
    jasmineUnitTasks.push('jasmine:' + sname);
    jasmineCoverageTasks.push('jasmine:' + sname + 'Coverage');
    jasmineSpecs[sname] = {
      src: FILES.src.concat(FILES.srcprovider).concat(FILES.jasminehelper),
      options: {
        specs: spec,
        keepRunner: false 
      }
    };
    jasmineSpecs[sname + 'Coverage'] = {
      src: FILES.src.concat(FILES.srcprovider).concat(FILES.jasminehelper),
      options: {
        specs: spec,
        template: require('grunt-template-jasmine-istanbul'),
        templateOptions: {
          coverage: 'tools/coverage' + jasmineUnitTasks.length + '.json',
          report: []
        }
      }
    }
  });
  FILES.specintegration.forEach(function(spec) {
    var sname = spec + "Spec";
    jasmineIntegrationTasks.push("jasmine:"+sname);
    jasmineSpecs[sname] = {
      src: FILES.src.concat(FILES.srcprovider).concat(FILES.jasminehelper),
      options: {
        specs: spec,
        keepRunner: false
      }
    };
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
        src: 'tools/lcov.info'
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
  grunt.registerTask('saucelabs', [
    'jasmineUnitTasks',
    'spawn-web-server',
    'saucelabs-jasmine',
    'kill-web-server',
  ]);
  grunt.registerTask('default', ['freedom']);
};
