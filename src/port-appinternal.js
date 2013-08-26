/*globals fdom:true, handleEvents, mixin, eachProp, XMLHttpRequest, resolvePath */
/*jslint indent:2,white:true,node:true,sloppy:true */
if (typeof fdom === 'undefined') {
  fdom = {};
}
fdom.port = fdom.port || {};

/**
 * An agent configuring a local application to run in this scope.
 * @class Agent.Local
 * @extends Agent
 * @constructor
 */
fdom.port.AppInternal = function() {
  this.config = {};
  this.id = 'environment' + Math.random();

  handleEvents(this);
};

fdom.port.AppInternal.prototype.onMessage = function(flow, message) {
  if (flow === 'control') {
    if (!this.controlChannel && message.channel) {
      this.controlChannel = message.channel;
      mixin(this.config, message.config);
    }
  } else if (flow === 'default') {
    this.loadLinks(message.id, message.manifest.permissions);
    this.loadScripts(message.id, message.manifest.app.script);
  }
};

fdom.port.AppInternal.prototype.toString = function() {
  return "[App Environment Helper]";
};

fdom.port.AppInternal.prototype.attach = function(name) {
  var exp = this.config.global.freedom;

  exp[name] = function() {};
};

fdom.port.AppInternal.prototype.loadLinks = function(items) {
  var i;
  for (i = 0; i < items.length; i += 1) {
    this.attach(items[i]);
  }
};

fdom.port.AppInternal.prototype.loadScripts = function(from, scripts) {
  var i, importer = this.config.global.importScripts;
  if (importer) {
    try {
      if (typeof scripts === 'string') {
        importer(resolvePath(scripts, from));
      } else {
        for (i = 0; i < scripts.length; i += 1) {
          importer(resolvePath(scripts[i], from));
        }
      }
    } catch(e) {
      console.error("Error Loading ", scripts, e.message);
    }
  }
};

