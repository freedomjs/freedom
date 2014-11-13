var testUtil = require('../../util');

module.exports = function (oa, pageauths, setup) {
  'use strict';
  var oauth;
  var registeredRedirectURIs = [
    "https://willscott.github.io/freedom-oauth-relay/oauth-relay.html"
  ];
  var clientId = "513137528418-i52cg29ug3qjiqta1ttcvrguhrjjq2so.apps.googleusercontent.com";

  beforeEach(function () {
    setup();
    oa.register(pageauths);
    oauth = testUtil.directProviderFor(oa.provider.bind(oa.provider, {}), testUtil.getApis().get(oa.name).definition);
  });

  afterEach(function () {
    oa.reset();
  });

  it("Generates a token", function (done) {
    var o = oauth();
    
    o.initiateOAuth(registeredRedirectURIs).then(function(obj) {
      // Cheating a little bit to avoid going through Google. 
      // Just call the redirect URL directly e.g.
      // https://willscott.github.io/freedom-oauth-relay/oauth-relay.html#state=freedom.oauth.redirect.handler0.05948500754311681&access_token=ya29.rADhKXAGx0fJfB0Vx5ibQUSmMvcK9GYVZBLId42Tvn9-aQEBD5HEsbKh-5Kj_D-j09wD5axgoIkadA&token_type=Bearer&expires_in=3600

      /**
      var url = "https://accounts.google.com/o/oauth2/auth?" +
        "client_id="+clientId+"&" +
        "response_type=token&" +
        "scope=email%20" + encodeURIComponent("https://www.googleapis.com/auth/userinfo.profile") + "&" +
        "redirect_uri=" + encodeURIComponent(obj.redirect) + "&" +
        "state=" + encodeURIComponent(obj.state);
      **/
      var url = obj.redirect+"#state="+encodeURIComponent(obj.state)+
                  "&access_token=thisisanaccesstoken";

      return o.launchAuthFlow(url, obj);
    }).then(function(url) {
      //console.log(url);
      expect(url).toEqual(jasmine.any(String));
      var query = url.substr(url.indexOf('#') + 1);
      var params = {};
      var keys = query.split('&');

      for (var i = 0; i < keys.length; i += 1) {
        var param = keys[i].substr(0, keys[i].indexOf('='));
        params[param] = keys[i].substr(keys[i].indexOf('=') + 1);
      }
      expect(params).toEqual(jasmine.objectContaining({
        access_token: jasmine.any(String)
      }));
      done();
    }).catch(function (err) {
      expect(err).toBeUndefined();
    });

  });
  
};
