var oAuth = require('../../../providers/core/oauth');
var PromiseCompat = require('es6-promise').Promise;
var setup = require('../../../src/entry');

var mockProvider = function (list) {
  list(function(url, auth) {
    return PromiseCompat.resolve('Return Value');
  });
};

describe('oAuth', function () {
  it("Delegates to registered handlers", function (done) {
    var de = jasmine.createSpy('de'),
      cb = jasmine.createSpy('cb');
    var authProvider = new oAuth.provider({}, de);
    authProvider.initiateOAuth(['http://localhost/oAuthRedirect'], cb);
    expect(cb).toHaveBeenCalledWith(null, jasmine.objectContaining({errcode: 'UNKNOWN'}));

    oAuth.register([mockProvider]);
    authProvider.initiateOAuth(['http://localhost/oAuthRedirect'], cb);
    expect(cb).toHaveBeenCalledWith(null, jasmine.objectContaining({errcode: 'UNKNOWN'}));

    authProvider = new oAuth.provider({}, de);
    authProvider.initiateOAuth(['http://localhost/oAuthRedirect'], function (ret) {
      expect(ret).toEqual('Return Value');
      done();
    });
  });

  it("Supports user-provided oAuth handlers", function (done) {
    var spy = jasmine.createSpy('oAuth CB');
    var provider = function(list) {
      list(function(url, auth) {
        spy(url);
        return PromiseCompat.resolve('Return Value');
      });
    };
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
  
  afterEach(function () {
    oAuth.reset();
  });
});
