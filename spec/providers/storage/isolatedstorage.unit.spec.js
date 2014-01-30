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

  it("gets saved items", function() {
    var d = jasmine.createSpy('get');
    provider.get('mykey', d);
    expect(d).toHaveBeenCalledWith('value');
    expect(provider.store.get).toHaveBeenCalledWith('myId;mykey');
  });

  it("sets items", function() {
    var d = jasmine.createSpy('set');
    provider.set('mykey', 'myval', d);
    expect(d).toHaveBeenCalled();
    expect(provider.store.set).toHaveBeenCalledWith('myId;mykey', 'myval');
  });

  it("Removes items", function() {
    var d = jasmine.createSpy('remove');
    provider.remove('mykey', d);
    expect(d).toHaveBeenCalled();
    expect(provider.store.remove).toHaveBeenCalledWith('myId;mykey');
  });

  it("Clears storage", function() {
    var d = jasmine.createSpy('clear');
    provider.clear(d);
    expect(d).toHaveBeenCalled();
    expect(provider.store.remove).toHaveBeenCalled();
  });
});
