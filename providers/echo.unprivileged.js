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

Echo_unprivileged.prototype.setup = function(proxy, continuation) {
  continuation();
  if (!this.core) {
    this.dispatchEvent('message', 'no core available to setup proxy with at echo');
    return;
  }

  this.core.bindChannel(proxy, function(chan) {
    this.chan = chan;
    this.dispatchEvent('message', 'channel bound to echo');
    this.chan.on('message', function(m) {
      this.dispatchEvent('message', 'from custom channel: ' + m);
    }.bind(this));
  }.bind(this));
};

Echo_unprivileged.prototype.send = function(str, continuation) {
  continuation();
  if (this.chan) {
    this.chan.emit('message', str);
  } else {
    this.dispatchEvent('message', 'no channel available');    
  }
};

fdom.apis.register("core.echo", Echo_unprivileged);
