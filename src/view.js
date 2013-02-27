var fdom = fdom || {};

/**
 * A FreeDOM view is provided as a core service to providers, allowing them
 * the capability of providing screen realestate.  Implementation is conducted
 * as a sandboxed iFrame at separate origin, whose sendMessage channel is
 * given to the provider.
 */
fdom.View = function(channel) {
  this.host = null;
  this.win = null;
  this.channel = channel;
  handleEvents(this);
};

fdom.View.prototype.show = function(args, continuation) {
  console.log(args);
  var host = document.createElement("div");
  document.body.appendChild(host);
  var root = host;
  // TODO(willscott): Support shadow root as available.
  if (host['webkitCreateShadowRoot']) {
    root = host['webkitCreateShadowRoot']();
  }
  var frame = document.createElement("iframe");
  frame.setAttribute("sandbox", "allow-scripts");
  if (args['file']) {
    frame.src = args['file'];
  } else if (args['code']) {
    frame.src = "data:text/html;charset=utf-8," + args['code'];
  }
  frame.style.position = 'fixed';
  frame.style.top = '0px';
  frame.style.left = '0px';
  frame.style.width = '100%';
  frame.style.height = '100%';
  frame.style.background = 'rgba(255,255,255,0.75)';
  frame.style.border = '0px';
  root.appendChild(frame);
  this.win = frame;
  continuation({});
}

fdom.View.prototype.postMessage = function(args, continuation) {
  this.win.contentWindow.postMessage(args, '*');
}

fdom.View.prototype.close = function() {
  if (this.host) {
    this.host.parentNode.removeChild(this.host);
    this.host = null;
  }
  if (this.win) {
    this.win.removeEventListener('message', this.onMessage, true);
    this.win = null;
  }
}

fdom.View.prototype.onMessage = function(m) {
  this.channel.postMessage({
    'action':'event',
    'type': 'message',
    'value': m.data
  });
}

fdom.apis.register("core.view", fdom.View);
