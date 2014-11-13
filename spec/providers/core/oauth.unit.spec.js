var oAuth = require('../../../providers/core/core.oauth');
var setup = require('../../../src/entry');
var PromiseCompat = require('es6-promise').Promise;

function MockProvider() {
  // Empty Constructor.
};

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
    oAuth.register([MockProvider]);
    var authProvider = new oAuth.provider({}, de);

    var callbackOne = function(stateObj) {
      expect(stateObj).toEqual(jasmine.objectContaining({
        redirect: "http://localhost/oAuthRedirect",
        state: jasmine.any(Number)
      }));
      authProvider.launchAuthFlow("AUTH URL", stateObj, callbackTwo);
    };

    var callbackTwo = function(respUrl) {
      expect(respUrl).toEqual(jasmine.any(String));
      done();
    };

    authProvider.initiateOAuth(['http://localhost/oAuthRedirect'], callbackOne);
  });

  it("Supports user-provided oAuth handlers", function (done) {
    var spy = jasmine.createSpy('oAuth CB');

    var freedom = setup({
      providers: [oAuth]
    }, '', {
      oauth: [MockProvider]
    });

    freedom.catch(function () {
      var de = jasmine.createSpy('de'),
        cb = jasmine.createSpy('cb');
      var authProvider = new oAuth.provider({}, de);
      authProvider.initiateOAuth(['http://localhost/oAuthRedirect'], function (ret, err) {
        expect(ret.redirect).toEqual("http://localhost/oAuthRedirect");
        done();
      });
    });
  });
  
  afterEach(function () {
    oAuth.reset();
  });
});
