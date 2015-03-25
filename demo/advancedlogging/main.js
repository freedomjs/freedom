/*globals freedom*/
var logger, syncLogger;

// Create a logger for this module.
freedom.core().getLogger('[Log Client]').then(function (log) {
  'use strict';
  logger = log;
  logger.log('Log Client Instantiated');
});

// Simpler example of using the synchronous logger shim.
// Note: the synchronous logger is an exception in that it is called on
// freedom.core, rather than freedom.core().
syncLogger = freedom.core.getLoggerSync('[Sync Log Client]');

var page = freedom();
//  Allow appending log messages.
page.on('warn', function (msg) {
  'use strict';
  logger.warn(msg);
});

page.on('warnSync', function (msg) {
  'use strict';
  syncLogger.warn(msg);
});


// Relay log messages back to the page.
var backchannel = freedom.logger();
backchannel.on('msg', function (msg) {
  'use strict';
  page.emit('log', msg);
});
