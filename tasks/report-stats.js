/*jslint node:true */

/**
 * This task saves the following output statistics from continuous integration
 * so that they can be tracked between builds:
 * * Artifact size of freedom.js
 * * Build time
 * * Commit
 * * Branch
 */
module.exports = function (grunt) {
  'use strict';
  var request = require('request'),
    fs = require('fs'),
    start = new Date();

  grunt.registerTask('reportStats', 'Report build statistics.', function () {
    var done = this.async(),
      size = fs.statSync('freedom.js').size;

    request({
      url: 'https://script.google.com/macros/s/' +
            'AKfycbyssdIXai4pthm-mikC-jrUYUjGKzVmV-NgIVilIv9dJPcvRaU/exec',
      qs: {
        time: new Date() - start,
        size: size,
        commit: process.env.TRAVIS_COMMIT,
        branch: process.env.TRAVIS_BRANCH,
        failures: 0,
        freedom: process.env.STAT_KEY
      }
    }, function (err, response) {
      if (err !== null) { grunt.fail.warn(err); }
      grunt.log.writeln('Reported file size of ' + size + ' to freedomjs.org!');
      done();
    });
  });
};
