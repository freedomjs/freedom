var fdom = fdom || {};

/**
 * A FreeDOM view is provided as a core service to providers, allowing them
 * the capability of providing screen realestate.  Implementation is conducted
 * as a sandboxed iFrame at separate origin, whose sendMessage channel is
 * given to the provider.
 */
fdom.View = function() {
};

fdom.View.prototype.show = function() {
  var frame = document.createElement("iframe");
  frame.setAttribute("sandbox", "allow-scripts");
//  frame.src = "data:text/html;charset=utf-8,<html><script type='text/javascript'>(" + fdom.View.prototype.controller.toString() + ")();</script></html>";
  document.body.appendChild(frame);
  this.win = frame;
}

fdom.View.prototype.close = function() {
  console.log("close called.");
}

/**
 * The controller function is executed within a view to establish connectivity back
 * to the view container.
 */
fdom.View.prototype.controller = function() {
  var body = document.createElement("body");
  document.appendChild(body);
  window.onMessage = function(m) {
    body.innerText = m.data;
  }
}

fdom.apis.register("core.view", fdom.View);
