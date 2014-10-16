/*globals freedom*/
var logger;
freedom.core().getLogger('[Log Client]').then(function (log) {
  'use strict';
  logger = log;
  logger.log('Log Client Instantiated');
});

var instance = freedom();
instance.on('warn', function (msg) {
  'use strict';
  logger.warn(msg);
});

var backchannel = freedom.logger();
backchannel.on('msg', function (msg) {
  'use strict';
  instance.emit('log', msg);
});
