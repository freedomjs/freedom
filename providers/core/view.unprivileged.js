/*globals fdom, document */
/*jslint indent:2,sloppy:true */
/**
 * A FreeDOM view is provided as a core service for displaying some UI.
 * Implementation is currently designed as a sandboxed iFrame that the
 * browser treats as a 'null' origin, whose sendMessage channel is
 * given to the provider.
 * @Class View_unprivileged
 * @constructor
 * @private
 * @param {App} app The application creating this provider.
 */
var View_unprivileged = function (app, dispatchEvent) {
  this.dispatchEvent = dispatchEvent;
  this.host = null;
  this.win = null;
  this.app = app;
  fdom.util.handleEvents(this);
};

/**
 * Ask for this view to open a specific location, either a File relative to
 * the loader, or an explicit code location.
 * @method open
 * @param {String} name The identifier of the view. Used to choose attachment.
 * @param {Object} what What UI to load.
 * @param {Function} continuation Function to call when view is loaded.
 */
View_unprivileged.prototype.open = function (name, what, continuation) {
  this.host = document.createElement("div");
  this.host.style.width = "100%";
  this.host.style.height = "100%";
  this.host.style.display = "relative";

  var container = document.body,
    config = this.app.config.views,
    root,
    frame;
  if (config && config[name] && document.getElementById(name)) {
    container = document.getElementById(name);
  }

  container.appendChild(this.host);
  root = this.host;
  // TODO(willscott): Support shadow root as available.
  // if (this.host['webkitCreateShadowRoot']) {
  //   root = this.host['webkitCreateShadowRoot']();
  // }
  frame = document.createElement("iframe");
  frame.setAttribute("sandbox", "allow-scripts allow-forms");
  if (what.file) {
    fdom.resources.get(this.app.manifestId, what.file).then(function (fname) {
      this.finishOpen(root, frame, fname, continuation);
    }.bind(this));
  } else if (what.code) {
    this.finishOpen(root, frame, "data:text/html;charset=utf-8," + what.code, continuation);
  } else {
    continuation(false);
  }
};

View_unprivileged.prototype.finishOpen = function (root, frame, src, continuation) {
  frame.src = src;
  frame.style.width = "100%";
  frame.style.height = "100%";
  frame.style.border = "0";
  frame.style.background = "transparent";
  root.appendChild(frame);

  this.app.config.global.addEventListener('message', this.onMessage.bind(this), true);

  this.win = frame;
  continuation({});
};

View_unprivileged.prototype.show = function (continuation) {
  continuation();
};

View_unprivileged.prototype.postMessage = function (args, continuation) {
  this.win.contentWindow.postMessage(args, '*');
  continuation();
};

View_unprivileged.prototype.close = function (continuation) {
  if (this.host) {
    this.host.parentNode.removeChild(this.host);
    this.host = null;
  }
  if (this.win) {
    this.app.config.global.removeEventListener('message', this.onMessage.bind(this), true);
    this.win = null;
  }
  continuation();
};

View_unprivileged.prototype.onMessage = function (m) {
  if (m.source === this.win.contentWindow) {
    this.dispatchEvent('message', m.data);
  }
};

fdom.apis.register("core.view", View_unprivileged);
