describe("providers/core/Logger_console", function() {
  var app, logger, console;

  beforeEach(function() {
    app = createTestPort('test');
    app.config = {
      global: {
        console: {}
      }
    };
    console = app.config.global.console;
    
    app.controlChannel = 'control';
    logger = new Logger_console(app);
  });

  it("Prints messages at correct levels", function() {
    logger.level = 'debug';
    Object.keys(Logger_console.level).forEach(function(level) {
      console[level] = jasmine.createSpy(level);
      logger[level]('test', 'MyMsg', function() {});
      expect(console[level]).toHaveBeenCalled();
    });

    logger.level = 'warn';
    Object.keys(Logger_console.level).forEach(function(level) {
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
