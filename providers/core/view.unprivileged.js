/*globals fdom, document */
/*jslint indent:2,sloppy:true */
/**
 * A freedom.js view is the interface for user interaction.
 * A view exists as an iFrame, which is shown to the user in some way.
 * communication between the view and the freedom.js module is performed
 * through the HTML5 postMessage mechanism, which this provider translates
 * to freedom.js message events.
 * @Class View_unprivileged
 * @constructor
 * @private
 * @param {port.Module} caller The module creating this provider.
 * @param {Function} dispatchEvent Function to call to emit events.
 */
var View_unprivileged = function (caller, dispatchEvent) {
  this.dispatchEvent = dispatchEvent;
  this.host = null;
  this.win = null;
  this.module = caller;
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
    config = this.module.manifest.views,
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
    fdom.resources.get(this.module.manifestId, what.file).then(
      function (fname) {
        this.finishOpen(root, frame, fname, continuation);
      }.bind(this)
    );
  } else if (what.code) {
    this.finishOpen(root, frame, "data:text/html;charset=utf-8," + what.code,
                    continuation);
  } else {
    continuation(false);
  }
};

View_unprivileged.prototype.finishOpen = function (root, frame, src,
    continuation) {
  frame.src = src;
  frame.style.width = "100%";
  frame.style.height = "100%";
  frame.style.border = "0";
  frame.style.background = "transparent";
  root.appendChild(frame);

  this.module.config.global.addEventListener('message',
      this.onMessage.bind(this), true);

  this.win = frame;
  continuation();
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
    this.module.config.global.removeEventListener('message',
        this.onMessage.bind(this), true);
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
