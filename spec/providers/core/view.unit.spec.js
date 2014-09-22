var View = require('../../../providers/core/view.unprivileged');

describe("core.view", function() {
  var provider, app, el;

  beforeEach(function() {
    app = {
      config: {
        global: window
      },
      manifestId: 'myApp',
      manifest: {
        views: {}
      }
    };
    provider = new View.provider(app);
 
    el = document.createElement('div');
    el.id = 'myview';
    document.body.appendChild(el);
  });

  afterEach(function() {
    document.body.removeChild(el);
    delete el;
  });

  it("Places objects and cleans up.", function() {
    app.manifest.views['myview'] = true;

    var cb = jasmine.createSpy('cb');
    provider.open('myview', {'code': ''}, cb);
    expect(cb).toHaveBeenCalled();

    expect(el.children.length).not.toBe(0);

    provider.close(cb);
    expect(el.innerHTML).toBe("");
  });

  // TODO: Understand phantom security model better.
  it("Roundtrips messages", function(done) {
    app.manifest.views['myview'] = true;

    provider.dispatchEvent = jasmine.createSpy('de');
    provider.dispatchEvent.and.callFake(function() {
      expect(provider.dispatchEvent).toHaveBeenCalledWith('message', 'msg');
      provider.close(done);
    });
    var sendMsg = function() {
      provider.postMessage('msg', function() {});
    }
    var onShow = function() {
      setTimeout(sendMsg, 0);
    };
    var onOpen = function() {
      provider.show(onShow);
    };
    provider.open('myview', {'code': '<script>window.addEventListener("message", function(m) {m.source.postMessage(m.data, "*");}, true);</script>'}, onOpen);
  });
});
