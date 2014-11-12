var oAuth = require('../../providers/core/core.oauth');
var PromiseCompat = require('es6-promise').Promise;
var setup = require('../../src/entry');

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
    oAuth.register(MockProvider);

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

  it("Supports user-provided oAuth handlers", function (done) {
    var provider = jasmine.createSpy('oAuth CB').and.callFake(MockProvider);
    var freedom = setup({
      providers: [oAuth]
    }, '', {
      oauth: provider
    });
    
    freedom.catch(function () {
      var de = jasmine.createSpy('de'),
        cb = jasmine.createSpy('cb');
      var authProvider = new oAuth.provider({}, de);
      authProvider.initiateOAuth(['http://localhost/oAuthRedirect'], cb).then(function () {
        expect(provider).toHaveBeenCalled();
        expect(cb.calls.count()).toEqual(1);
        expect(cb).toHaveBeenCalledWith('Return Value');
        done();
      });
    });
  });
  
  afterEach(function () {
    oAuth.reset();
  });
});
