module.exports = function(grunt) {
  grunt.initConfig({
    jasmine: {
      freedom: {
        src: ['src/*.js','src/proxy/*js'],
        options: {
          specs: 'spec/*Spec.js'
        }
      }
    }
  });

  // Load tasks.
  grunt.loadNpmTasks('grunt-contrib-jasmine');

  // Default tasks.
  grunt.registerTask('default', ['jasmine']);
};
