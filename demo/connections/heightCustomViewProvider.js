/*globals Promise */

var HeightView = function () {
  'use strict';
  window.addEventListener('message', function (msg, source) {
    if (this.frameWindow === source.source) {
      this.postMessage(msg.data);
    }
  }.bind(this), true);

  this.onOpen = function (id, name, page, resources, postMessage) {
    var container = document.getElementById('connections'),
      root,
      frame;

    root = document.createElement("div");
    root.style.width = "100%";
    root.style.height = "109px";
    root.style.display = "relative";

    container.appendChild(root);

    return new Promise(function (resolve, reject) {
      frame = document.createElement("iframe");
      frame.setAttribute("sandbox", "allow-scripts allow-forms");
      frame.style.width = "100%";
      frame.style.height = "100%";
      frame.style.border = "0";
      frame.style.background = "transparent";
      frame.src = page;
      frame.addEventListener('load', resolve, true);
      
      root.appendChild(frame);
      
      this.root = root;
      this.frameWindow = frame.contentWindow;
      this.postMessage = postMessage;
    }.bind(this));
  };
  this.onMessage = function (id, message) {
    if (message.height) {
      this.root.style.height = message.height + 'px';
    } else {
      this.frameWindow.postMessage(message, '*');
    }
  };
  this.onClose = function (id) {
    this.root.parentNode.removeChild(this.root);
    delete this.root;
    delete this.frameWindow;
    delete this.postMessage;
  };
};
