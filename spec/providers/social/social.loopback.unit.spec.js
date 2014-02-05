describe("social.loopback", function() {
  var prov, code_net, code_cli;
  beforeEach(function() {
    code_net = {'ONLINE': 'on!', 'OFFLINE': 'no!'};
    code_cli = {'MESSAGABLE': 'm'};
    freedom = {
      social: mockIface([], [
        ['STATUS_NETWORK', code_net],
        ['STATUS_CLIENT', code_cli]
      ])
    };
    jasmine.clock().install();
    prov = new LoopbackSocialProvider();
    prov.dispatchEvent = jasmine.createSpy('de');
  });
  
  afterEach(function() {
    jasmine.clock().uninstall();
  });

  it("dispatches initial status", function() {
    jasmine.clock().tick(100);
    expect(prov.dispatchEvent).toHaveBeenCalled();
  });

  it("Logs in", function() {
    var cb = jasmine.createSpy('cb');
    prov.login(null, cb);
    expect(prov.dispatchEvent.calls.mostRecent().args[1].status).toEqual('on!');
    expect(cb).toHaveBeenCalled();
  });

  it("Logs out", function() {
    prov.login(null, function() {});
    var cb = jasmine.createSpy('cb');
    prov.logout(null, cb);
    expect(prov.dispatchEvent.calls.mostRecent().args[1].status).toEqual('no!');
    expect(cb).toHaveBeenCalled();
  });
  
  it("sends & dispatches messages", function() {
    prov.login(null, function() {});
    var cb = jasmine.createSpy('cb');
    prov.sendMessage('random', 'mymsg', cb);
    
    expect(cb).toHaveBeenCalled();
    expect(prov.dispatchEvent.calls.mostRecent().args[1].message).toEqual('mymsg');
  });
});
