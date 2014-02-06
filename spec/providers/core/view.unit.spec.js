describe("core.view", function() {
  var provider, app;

  beforeEach(function() {
    app = {
      config: {
        views: {},
        global: window
      },
      manifestId: 'myApp',
    };
    provider = new View_unprivileged(app);
  });

  it("Places objects and cleans up.", function() {
    app.config.views['myview'] = true;
    var el = document.createElement('div');
    el.id = 'myview';
    document.body.appendChild(el);

    var cb = jasmine.createSpy('cb');
    provider.open('myview', {'code': ''}, cb);
    expect(cb).toHaveBeenCalled();

    expect(el.children.length).not.toBe(0);

    provider.close(cb);
    expect(el.innerHTML).toBe("");
  });

  // TODO: Understand phantom security model better.
  xit("Roundtrips messages", function(done) {
    var onReturn = function() {
      expect(provider.dispatchEvent).toHaveBeenCalledWith('msg');
      provider.close(done);
    };
    provider.dispatchEvent = jasmine.createSpy('cb');
    provider.dispatchEvent.and.callFake(onReturn);
    var sendMsg = function() {
      provider.postMessage('msg', function() {});
    }
    var onShow = function() {
      setTimeout(sendMsg, 0);
    };
    var onOpen = function() {
      provider.show(onShow);
    };
    provider.open('myview', {'code': '<script>window.addEventListener("message", function(m) {parent.postMessage(m, "*");}, true);</script>'}, onOpen);    
  });
});
