module.exports = function(grunt) {
  grunt.initConfig({
    jasmine: {
      freedom: {
        src: ['src/*.js', 'src/proxy/*.js'],
        options: {
          specs: 'spec/*Spec.js'
        }
      }
    },
    jshint: {
      beforeconcat: ['src/*.js', 'src/proxy/*.js'],
      afterconcat: ['freedom.js'],
      options: {
        '-W069': true
      }
    },
    concat: {
      dist: {
        src: [
          'src/util/preamble.js',
          'src/*.js',
          'src/proxy/*.js',
          'providers/*.js',
          'interface/*.js',
          'src/util/postamble.js'
        ],
        dest: 'freedom.js'
      }
    }
  });

  // Load tasks.
  grunt.loadNpmTasks('grunt-contrib-jasmine');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-concat');

  // Default tasks.
  grunt.registerTask('default', [
    'jasmine',
    'jshint:beforeconcat',
    'concat',
    'jshint:afterconcat'
  ]);
};
