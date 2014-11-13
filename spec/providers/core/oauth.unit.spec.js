var oAuth = require('../../../providers/core/core.oauth');
var setup = require('../../../src/entry');
var PromiseCompat = require('es6-promise').Promise;

function MockProvider() {
  return PromiseCompat.resolve('Return Value');
}

MockProvider.prototype.initiateOAuth = function(redirectURIs, cont) {
  cont({
    redirect: "http://localhost/oAuthRedirect",
    state: Math.random()
  });
  return true;
};

MockProvider.prototype.launchAuthFlow = function(authUrl, stateObj, cont) {
  cont("Response Url");
  return true;
};

describe('oAuth', function () {
  it("oauth: Checks for a valid registered handler", function(done) {
    var de = jasmine.createSpy('de'),
      cb = jasmine.createSpy('cb');
    var authProvider = new oAuth.provider({}, de);
    authProvider.initiateOAuth(['http://localhost/oAuthRedirect'], cb);
    expect(cb).toHaveBeenCalledWith(null, jasmine.objectContaining({errcode: 'UNKNOWN'}));
    done();
  });

  it("oauth: Delegates to registered handlers", function (done) {
    var de = jasmine.createSpy('de'),
      cb = jasmine.createSpy('cb');
    var authProvider = new oAuth.provider({}, de);
    oAuth.register([MockProvider]);

    var callbackOne = function(stateObj) {
      expect(stateObj).toEqual(jasmine.objectContaining({
        redirect: "http://localhost/oAuthRedirect",
        state: jasmine.any(Number)
      }));
      authProvider.launchAuthFlow("AUTH URL", stateObj, callbackTwo);
    };

    var callbackTwo = function(respUrl) {
      expect(stateObj).toEqual(jasmine.any(String));
      done();
    };

    authProvider.initiateOAuth(['http://localhost/oAuthRedirect'], callbackOne);
  });

/**
  it("Supports user-provided oAuth handlers", function (done) {
<<<<<<< HEAD:spec/src/oauth.spec.js
    var provider = jasmine.createSpy('oAuth CB').and.callFake(MockProvider);
=======
    var spy = jasmine.createSpy('oAuth CB');
    var provider = function(list) {
      list(function(url, auth) {
        spy(url);
        return PromiseCompat.resolve('Return Value');
      });
    };
>>>>>>> 0.6-views:spec/providers/core/oauth.unit.spec.js
    var freedom = setup({
      providers: [oAuth]
    }, '', {
      oauth: [provider]
    });
    
    freedom.catch(function () {
      var de = jasmine.createSpy('de'),
        cb = jasmine.createSpy('cb');
      var authProvider = new oAuth.provider({}, de);
      authProvider.initiateOAuth(['http://localhost/oAuthRedirect'], function (ret, err) {
        expect(spy).toHaveBeenCalled();
        expect(ret).toEqual('Return Value');
        done();
      });
    });
  });
**/
  
  afterEach(function () {
    oAuth.reset();
  });
});
