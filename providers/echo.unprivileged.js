/*globals fdom:true, handleEvents, mixin, eachProp, makeAbsolute */
/*jslint indent:2,white:true,sloppy:true */

/**
 * A minimal provider implementing the core.echo interface for interaction with
 * custom channels.  Primarily used for testing the robustness of the custom
 * channel implementation.
 * @Class Echo_unprivileged
 * @constructor
 * @param {App} app The application creating this provider.
 */
var Echo_unprivileged = function(app) {
  this.app = app;
  handleEvents(this);

  // The Core object for managing channels.
  this.app.once('core', function(Core) {
    this.core = new Core();
  }.bind(this));
  this.app.emit(this.app.controlChannel, {
    type: 'core request delegated to echo',
    request: 'core'
  });
};

/**
 * Setup the provider to echo on a specific proxy. Subsequent messages
 * From the custom channel bound here will be re-emitted as a message
 * from the provider.  Subsequent messages to the provider will be
 * emitted on the bound channel.
 * @param {Object} proxy The identifier for the custom channel to bind.
 * @param {Function} continuation Function to call when setup is complete.
 * @method setup
 */
Echo_unprivileged.prototype.setup = function(proxy, continuation) {
  continuation();
  if (!this.core) {
    this.dispatchEvent('message', 'no core available to setup proxy with at echo');
    return;
  }

  this.core.bindChannel(proxy, function(chan) {
//    TODO(willscott): Support channel shutdown.
//    if (this.chan) {
//        this.chan.close();
//    }
    this.chan = chan;
    this.dispatchEvent('message', 'channel bound to echo');
    this.chan.on('message', function(m) {
      this.dispatchEvent('message', 'from custom channel: ' + m);
    }.bind(this));
  }.bind(this));
};

/**
 * Send a message to the bound custom channel.
 * @param {String} str The string to send.
 * @param {Function} continuation Function to call when sending is complete.
 * @method send
 */
Echo_unprivileged.prototype.send = function(str, continuation) {
  continuation();
  if (this.chan) {
    this.chan.emit('message', str);
  } else {
    this.dispatchEvent('message', 'no channel available');    
  }
};

fdom.apis.register("core.echo", Echo_unprivileged);
