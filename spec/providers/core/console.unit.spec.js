var testUtil = require('../../util');
var Console_unpriv = require('../../../providers/core/console.unprivileged');

describe("providers/core/Console_unprivileged", function() {
  var app, logger, console;

  beforeEach(function() {
    app = testUtil.createTestPort('test');
    app.config = {
      global: {
        console: {}
      }
    };
    console = app.config.global.console;
    
    app.controlChannel = 'control';
    logger = new Console_unpriv.provider(app);
  });

  it("Prints messages at correct levels", function() {
    logger.level = 'debug';
    Object.keys(Console_unpriv.provider.level).forEach(function(level) {
      console[level] = jasmine.createSpy(level);
      logger[level]('test', 'MyMsg', function() {});
      expect(console[level]).toHaveBeenCalled();
    });

    logger.level = 'warn';
    Object.keys(Console_unpriv.provider.level).forEach(function(level) {
      console[level] = jasmine.createSpy(level);
      logger[level]('test', 'MyMsg', function() {});
      if (level === 'warn' || level === 'error') {
        expect(console[level]).toHaveBeenCalled();
      } else {
        expect(console[level]).not.toHaveBeenCalled();
      }
    });
  
  });
});
