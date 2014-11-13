var View = require('../../../providers/core/core.view');
var PromiseCompat = require('es6-promise').Promise;
var testUtil = require('../../util');
var util = require('../../../src/util');

describe("core.view", function () {
  var provider, app, el, de;

  beforeEach(function () {
    app = {
      config: {
        global: window
      },
      
      resource: testUtil.setupResolvers(),
      manifestId: 'myApp',
      manifest: {
        views: {}
      }
    };
    de = jasmine.createSpy('dispatchEvents');
    util.handleEvents(app);
    provider = new View.provider(app, de);
 
    el = document.createElement('div');
    el.id = 'myview';
    document.body.appendChild(el);
  });

  afterEach(function () {
    document.body.removeChild(el);
    delete el;
  });

  it("Places objects and cleans up.", function (done) {
    app.manifest.views['myview'] = {
      main: "relative://spec/helper/view.html",
      files: []
    };

    var cb = jasmine.createSpy('cb');
    provider.show('myview', function () {
      expect(el.children.length).not.toBe(0);

      provider.close(cb);
      expect(el.innerHTML).toBe("");
      expect(cb).toHaveBeenCalled();
      done();
    });
  });

  it("Roundtrips messages", function (done) {
    app.manifest.views['myview'] = {
      main: "relative://spec/helper/view.html",
      files: []
    };
    
    var onPost = function (ret, err) {
      expect(err).toEqual(undefined);
    };
    
    var onMessage = function (type, data) {
      expect(type).toEqual('message');
      expect(data).toEqual('Echo: TEST');
      provider.close(done);
    };
    
    var onShow = function (ret, err) {
      expect(err).toEqual(undefined);
      de.and.callFake(onMessage);
      provider.postMessage('TEST', onPost);
    };

    provider.show('myview', onShow);
  });
});
