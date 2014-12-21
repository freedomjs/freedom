/*jslint node:true */

module.exports = function (grunt) {
  'use strict';
  var child_process = require('child_process');

  grunt.registerTask('publishWebsite', 'Publishes to freedomjs.org.', function () {
    var done = this.async();
    child_process.execFile('scripts/publishWebsite.sh', [], {
      cwd: '../'
    }, function(err, stdout, stderr) {
      if (err) { throw err; }
      if (stdout) { grunt.log.writeln('out: ' + stdout.toString()); }
      if (stderr) { grunt.log.writeln('err: ' + stderr.toString()); }
      grunt.log.writeln('Done publishing to freedomjs.org');
      done();
    });
  });
};
