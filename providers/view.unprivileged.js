/**
 * A FreeDOM view is provided as a core service to providers, allowing them
 * the capability of providing screen realestate.  Implementation is conducted
 * as a sandboxed iFrame at separate origin, whose sendMessage channel is
 * given to the provider.
 */
var View_unprivileged = function(channel) {
  this.host = null;
  this.win = null;
  this.channel = channel;
  handleEvents(this);
};

View_unprivileged.prototype.show = function(args, continuation) {
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
    frame.src = args['file'];
  } else if (args['code']) {
    frame.src = "data:text/html;charset=utf-8," + args['code'];
  }
  if (args['hide']) {
    frame.style.width = "0";
    frame.style.height = "0";
  } else {
    frame.style.position = 'fixed';
    frame.style.top = '0px';
    frame.style.left = '0px';
    frame.style.width = '100%';
    frame.style.height = '100%';
    frame.style.background = 'rgba(255,255,255,0.75)';
    frame.style.border = '0px';
  }
  root.appendChild(frame);
  this.win = frame;
  addEventListener('message', this.onMessage.bind(this), true);
  continuation({});
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
    this.channel.postMessage({
      'action':'event',
      'type': 'message',
      'value': m.data
    });
  }
}

fdom.apis.register("core.view", View_unprivileged);
