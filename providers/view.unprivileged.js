/**
 * A FreeDOM view is provided as a core service to providers, allowing them
 * the capability of providing screen realestate.  Implementation is conducted
 * as a sandboxed iFrame at separate origin, whose sendMessage channel is
 * given to the provider.
 * @constructor
 * @private
 */
var View_unprivileged = function(channel) {
  this.host = null;
  this.win = null;
  this.channel = channel;
  handleEvents(this);
};

View_unprivileged.prototype.open = function(args, continuation) {
  this.host = document.createElement("div");
  document.body.appendChild(this.host);
  var root = this.host;
  // TODO(willscott): Support shadow root as available.
  if (this.host['webkitCreateShadowRoot']) {
    root = this.host['webkitCreateShadowRoot']();
  }
  var frame = document.createElement("iframe");
  frame.setAttribute("sandbox", "allow-scripts allow-forms");
  if (args['file']) {
    var app = this.channel.app;
    frame.src = resolvePath(args['file'], app.id);
  } else if (args['code']) {
    frame.src = "data:text/html;charset=utf-8," + args['code'];
  }
  frame.style.width = "0";
  frame.style.height = "0";
  root.appendChild(frame);
  this.win = frame;
  addEventListener('message', this.onMessage.bind(this), true);
  continuation({});
}

View_unprivileged.prototype.show = function(continuation) {
  if (this.win) {
    // Fullscreen mode.
    this.win.style.position = 'fixed';
    this.win.style.top = '0px';
    this.win.style.left = '0px';
    this.win.style.width = '100%';
    this.win.style.height = '100%';
    this.win.style.background = 'rgba(255,255,255,0.75)';
    this.win.style.border = '0px';
    
    // Refresh Layout
    this.host.style.position = 'absolute';
  }
  continuation();
}

View_unprivileged.prototype.postMessage = function(args, continuation) {
  this.win.contentWindow.postMessage(args, '*');
}

View_unprivileged.prototype.close = function() {
  if (this.host) {
    this.host.parentNode.removeChild(this.host);
    this.host = null;
  }
  if (this.win) {
    removeEventListener('message', this.onMessage.bind(this), true);
    this.win = null;
  }
}

View_unprivileged.prototype.onMessage = function(m) {
  if (m.source == this.win.contentWindow) {
    this['dispatchEvent']('message', m.data);
  }
}

fdom.apis.register("core.view", View_unprivileged);
