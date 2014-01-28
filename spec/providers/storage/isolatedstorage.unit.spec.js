describe("providers.storage.isolated", function() {
  var provider;
  beforeEach(function() {
    freedom = {
      core: mockIface([['getId', ['myId']]]),
      'core.storage': mockIface([
        ['keys', ['myId;Test', 'otherTest']],
        ['get', 'value'],
        ['set', undefined],
        ['remove', undefined]
      ])
    };
    provider = new IsolatedStorageProvider();
  });

  it("returns owned keys", function() {
    var d = jasmine.createSpy('keys');
    provider.keys(d);
    expect(provider.store.keys).toHaveBeenCalled();
    expect(d).toHaveBeenCalledWith(['Test']);
  });
});