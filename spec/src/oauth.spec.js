var oAuth = require('../../providers/core/oauth');
var PromiseCompat = require('es6-promise').Promise;
var setup = require('../../src/entry');

var mockProvider = function(url, auth) {
  return PromiseCompat.resolve('Return Value');
};

describe('oAuth', function () {
  it("Delegates to registered handlers", function (done) {
    var de = jasmine.createSpy('de'),
      cb = jasmine.createSpy('cb');
    var authProvider = new oAuth.provider({}, de);
    authProvider.initiateOAuth(['http://localhost/oAuthRedirect'], cb);
    expect(cb).toHaveBeenCalledWith(null, jasmine.objectContaining({errcode: 'UNKNOWN'}));

    oAuth.register(mockProvider);

    authProvider.initiateOAuth(['http://localhost/oAuthRedirect'], cb).then(function () {
      expect(cb.calls.count()).toEqual(2);
      expect(cb).toHaveBeenCalledWith('Return Value');
      done();
    });
  });

  it("Supports user-provided oAuth handlers", function (done) {
    var provider = jasmine.createSpy('oAuth CB').and.callFake(mockProvider);
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
