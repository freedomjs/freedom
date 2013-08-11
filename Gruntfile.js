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
      options: {
        '-W069': true
      }
    }
  });

  // Load tasks.
  grunt.loadNpmTasks('grunt-contrib-jasmine');
  grunt.loadNpmTasks('grunt-contrib-jshint');

  // Default tasks.
  grunt.registerTask('default', ['jasmine', 'jshint:beforeconcat']);
};
