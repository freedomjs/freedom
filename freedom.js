/**
 * This script is loaded by each frame as the initial require dependency, and configures the layout of freedom code.
 */

requirejs.config({
    baseUrl: './',
    paths: {
        js: './',
				//app: './app'
    },
		shim: {
			'backbone': {
				deps: ['underscore'],
				exports: 'Backbone'
			},
			'underscore': {
				exports: '_'
			}
		}
});

define({
	load: function(name, req, load, config) {
		// Handle loading apps from either local bundle or localStorage.
		if (name.indexOf("/") != -1 && name.split("/")[0] == "app") {
      require([name], function(module) {
      	load(module);
      }, function(err) {
				// TODO(willscott): Load from local storage.
				console.log(err);
				load.error();
      });
		} else {
  		req([name], function(value) {
	  		load(value);
		  });
		}
	}
});
