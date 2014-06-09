/*globals freedom,importScripts */
/*jslint indent:2, white:true, sloppy:true, browser:true */

var registeredRedirectURIs = [
  "http://localhost:8000/demo/aboutme/"
];

var oauth = freedom['core.oauth']();
var redirectURI = null;

var buildURL = function (xsrf) {
  return "https://accounts.google.com/o/oauth2/auth?" +
      "client_id=513137528418-i52cg29ug3qjiqta1ttcvrguhrjjq2so.apps.googleusercontent.com&" +
      "response_type=token&" +
      "scope=" + encodeURIComponent("https://www.googleapis.com/auth/userinfo.profile") + "&" +
      "redirect_uri=" + encodeURIComponent(redirectURI) + "&" +
      "state=" + encodeURIComponent(xsrf);
};

oauth.on('oAuthEvent', function (url) {
  var query = url.substr(url.indexOf('#') + 1),
    param,
    params = {},
    keys = query.split('&'),
    i = 0,
    xhr = new XMLHttpRequest();

  for (i = 0; i < keys.length; i += 1) {
    param = keys[i].substr(0, keys[i].indexOf('='));
    params[param] = keys[i].substr(keys[i].indexOf('=') + 1);
  }
  
  // https://developers.google.com/api-client-library/javascript/features/cors
  // claims that googleapis.com supports CORS Headers. This is a lie.
  // However, undocumented everywere is the fact that the endpoint API does
  // support JSONP, which can also be used (though not super gracefully)
  // with freedom.js modules.
  importScripts("https://www.googleapis.com/userinfo/v2/me?" +
                "callback=onProfile&" +
                "access_token=" + params.access_token);
});

oauth.getRedirectURI().then(function (uris) {
  var i, j;
  for (i = 0; i < uris.length; i += 1) {
    for (j = 0; j < registeredRedirectURIs.length; j += 1) {
      if (uris[i].indexOf(registeredRedirectURIs[j]) > -1) {
        redirectURI = registeredRedirectURIs[j];
        freedom.emit('oAuth', buildURL(uris[i]));
        return;
      }
    }
  }
  freedom.emit('profile', {
    name: 'Unknown',
    details: 'oAuth unsupported!'
  });
});


var onProfile = function(resp) {
  if (resp.name) {
    resp.details = "Speaks: " + resp.locale + ", Gender: " + resp.gender;
  }
  freedom.emit('profile', resp);
};
