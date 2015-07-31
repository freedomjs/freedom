var testUtil = require('../../util');

module.exports = function (oa, pageauths, redirectURIs, setup) {
  'use strict';
  var oauth;
  var clientId = "513137528418-i52cg29ug3qjiqta1ttcvrguhrjjq2so.apps.googleusercontent.com";
  var oldJasmineDefaultTimeoutInterval;

  beforeEach(function () {
    setup();
    oa.register(pageauths);
    oauth = testUtil.directProviderFor(oa.provider.bind(oa.provider, {}), testUtil.getApis().get(oa.name).definition);
    oldJasmineDefaultTimeoutInterval = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 6000;
  });

  afterEach(function () {
    oa.reset();
    jasmine.DEFAULT_TIMEOUT_INTERVAL = oldJasmineDefaultTimeoutInterval;
  });

  it("Generates a token", function (done) {
    var o = oauth();

    o.initiateOAuth(redirectURIs).then(function(obj) {
      // Cheating a little bit to avoid going through Google.
      // Just call the redirect URL directly e.g.
      // https://willscott.github.io/freedom-oauth-relay/oauth-relay.html#state=freedom.oauth.redirect.handler0.05948500754311681&access_token=ya29.rADhKXAGx0fJfB0Vx5ibQUSmMvcK9GYVZBLId42Tvn9-aQEBD5HEsbKh-5Kj_D-j09wD5axgoIkadA&token_type=Bearer&expires_in=3600

      /*
      var url = "https://accounts.google.com/o/oauth2/auth?" +
        "client_id="+clientId+"&" +
        "response_type=token&" +
        "scope=email%20" + encodeURIComponent("https://www.googleapis.com/auth/userinfo.profile") + "&" +
        "redirect_uri=" + encodeURIComponent(obj.redirect) + "&" +
        "state=" + encodeURIComponent(obj.state);
      */
      var url = obj.redirect+"#state="+encodeURIComponent(obj.state)+
                  "&access_token=thisisanaccesstoken";

      return o.launchAuthFlow(url, obj, true);
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

  it("Fails if interactive=false and not redirected to uri", function (done) {
    var o = oauth();
    o.initiateOAuth(redirectURIs).then(function(obj) {
      var url = "http://error.com";
      var launchAuthFlowPromise = o.launchAuthFlow(url, obj, false);
      return launchAuthFlowPromise;
    }).catch(function(error) {
      done();
    });
  });

};
