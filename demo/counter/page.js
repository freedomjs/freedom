/*jslint sloppy:true */
/*globals freedom, console*/

/**
 * This is the JavaScript that runs directly in the browser.
 * It interacts with the DOM as normal, and communicates with
 * the freedom module that is running in a web worker, again
 * using the interface specified in freedom-module.json.
 **/

var start = function(Counter) {
  var counter = new Counter(0);
  //Send click events to the module.
  document.getElementById('click').onclick = function() {
    counter.click(1).then(function (sum) {
      document.getElementById('count').innerHTML = sum;
    });
  };
};

window.onload = function() {
  // After loading freedom.js, the window is populated with a 'freedom'
  // object, which is used as a message passing channel to the root module
  freedom('counter.json', {
    'debug': 'log'
  }).then(start);
};
