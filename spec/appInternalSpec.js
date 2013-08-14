describe("fdom.app.Internal", function () {
  var app, exp;

  beforeEach(function() {
    exp = {
      addEventListener: jasmine.createSpy('event'),
      postMessage: jasmine.createSpy('message')
    };
    var config = {global: exp};
    app = new fdom.app.Internal();
    app.configure(config);
  });

  it("Provides api channels", function() {
    var channel = app.getChannel();

    expect(exp.addEventListener).toHaveBeenCalled();
    expect(exp.postMessage).toHaveBeenCalledWith({sourceFlow: 'control', fromApp: true, request: 'create'}, '*');
    expect(channel).toEqual(jasmine.any(fdom.Channel));
  });

  it("Provides proxies", function() {
    var proxy = app.getProxy();

    expect(exp.addEventListener).toHaveBeenCalled();
    expect(proxy).toEqual(jasmine.any(fdom.Proxy.messageProxy));
  });

  it("self-configures with help from a hub", function() {
    var proxy = app.getProxy();
    var spy = jasmine.createSpy('import');
    exp.importScripts = spy;

    exp.addEventListener.calls[0].args[1]({
      data: {
        sourceFlow: 'control',
        msg: {
          id: makeAbsolute('spec/helper/manifest.json'),
          manifest: {
            app: {
              script: 'loadverifier.js'
            }
          },
          config: {}
        }
      }
    });

    expect(spy).toHaveBeenCalled();
  });
});
