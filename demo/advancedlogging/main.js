/*globals freedom*/
var logger;

// Create a logger for this module.
freedom.core().getLogger('[Log Client]').then(function (log) {
  'use strict';
  logger = log;
  logger.log('Log Client Instantiated');
});

var page = freedom();
//  Allow appending log messages.
page.on('warn', function (msg) {
  'use strict';
  logger.warn(msg);
});

// Relay log messages back to the page.
var backchannel = freedom.logger();
backchannel.on('msg', function (msg) {
  'use strict';
  page.emit('log', msg);
});
