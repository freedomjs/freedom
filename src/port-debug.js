/*globals fdom:true */
/*jslint indent:2, white:true, node:true, sloppy:true, browser:true */
if (typeof fdom === 'undefined') {
  fdom = {};
}
fdom.port = fdom.port || {};

/**
 * A freedom port providing debugging output to the console.
 * @uses handleEvents
 * @extends Port
 * @constructor
 */
fdom.port.Debug = function() {
  this.id = 'debug';
  this.emitChannel = false;
  this.console = null;
  this.config = false;
  this.logger = null;
  fdom.util.handleEvents(this);
};

/**
 * Provide a textual description of this port.
 * @method toString
 * @return {String} the textual description.
 */
fdom.port.Debug.prototype.toString = function() {
  return '[Console]';
};

/**
 * Handler for receiving messages sent to the debug port.
 * These messages are used to retreive config for exposing console.
 * @method onMessage
 * @param {String} source the source identifier for the message.
 * @param {Object} message the received message.
 */
fdom.port.Debug.prototype.onMessage = function(source, message) {
  if (source === 'control' && message.channel && !this.emitChannel) {
    this.emitChannel = message.channel;
    this.config = message.config;
    this.console = message.config.global.console;
    this.emit('ready');
  }
};

/**
 * Dispatch a debug message with arbitrary severity.
 * @method format
 * @param {String} severity the severity of the message.
 * @param {String} source The location of message.
 * @param {String[]} args The contents of the message.
 * @private
 */
fdom.port.Debug.prototype.format = function(severity, source, args) {
  var i, alist = [], argarr;
  if (typeof args === "string" && source) {
    try {
      argarr = JSON.parse(args);
      if (argarr instanceof Array) {
        args = argarr;
      }
    } catch(e) {
      // pass.
    }
  }

  if (typeof args === "string") {
    alist.push(args);
  } else {
    for (i = 0; i < args.length; i += 1) {
      alist.push(args[i]);
    }
  }
  if (!this.emitChannel) {
    this.on('ready', this.format.bind(this, severity, source, alist));
    return;
  }
  this.emit(this.emitChannel, {
    severity: severity,
    source: source,
    quiet: true,
    request: 'debug',
    msg: JSON.stringify(alist)
  });
};

/**
 * Print received messages on the console.
 * @method print
 * @param {Object} message The message emitted by {@see format} to print.
 */
fdom.port.Debug.prototype.print = function(message) {
  if (!this.logger || !this.logger.log) {
    if (!this.logger) {
      this.logger = fdom.apis.getCore('core.logger', this).then(function(Provider) {
        this.logger = new Provider();
        this.emit('logger');
      }.bind(this));
    }
    this.once('logger', this.print.bind(this, message));
    return;
  }

  var args, arr = [], i = 0;
  if (this.console !== this) {
    args = JSON.parse(message.msg);
    if (typeof args === "string") {
      arr.push(args);
    } else {
      while (args[i] !== undefined) {
        arr.push(args[i]);
        i += 1;
      }
    }
    this.logger[message.severity].call(this.logger, message.source, arr, function() {});
  }
};

/**
 * Print a log message to the console.
 * @method log
 */
fdom.port.Debug.prototype.log = function() {
  this.format('log', undefined, arguments);
};

/**
 * Print an info message to the console.
 * @method log
 */
fdom.port.Debug.prototype.info = function() {
  this.format('info', undefined, arguments);
};

/**
 * Print a debug message to the console.
 * @method log
 */
fdom.port.Debug.prototype.debug = function() {
  this.format('debug', undefined, arguments);
};

/**
 * Print a warning message to the console.
 * @method warn
 */
fdom.port.Debug.prototype.warn = function() {
  this.format('warn', undefined, arguments);
};

/**
 * Print an error message to the console.
 * @method error
 */
fdom.port.Debug.prototype.error = function() {
  this.format('error', undefined, arguments);
  if (this.console) {
    this.console.error.apply(this.console, arguments);
  }
};
