describe("unit: storage.shared.json", function () {
  var provider;
  beforeEach(function() {
    freedom = {
      core: mockIface([['getId', ['myId']]]),
      'core.storage': mockIface([
        ['keys', ['myId;Test', 'otherTest']],
        ['get', 'value'],
        ['set', undefined],
        ['remove', undefined],
        ['clear', undefined]
      ])
    };
    provider = new SharedStorageProvider();
  });

  it("returns owned keys", function() {
    var d = jasmine.createSpy('keys');
    provider.keys(d);
    expect(provider.store.keys).toHaveBeenCalled();
    expect(d).toHaveBeenCalledWith(['myId;Test', 'otherTest']);
  });

  it("gets saved items", function() {
    var d = jasmine.createSpy('get');
    provider.get('mykey', d);
    expect(d).toHaveBeenCalledWith('value');
    expect(provider.store.get).toHaveBeenCalledWith('mykey');
  });

  it("sets items", function() {
    var d = jasmine.createSpy('set');
    provider.set('mykey', 'myval', d);
    expect(d).toHaveBeenCalled();
    expect(provider.store.set).toHaveBeenCalledWith('mykey', 'myval');
  });

  it("Removes items", function() {
    var d = jasmine.createSpy('remove');
    provider.remove('mykey', d);
    expect(d).toHaveBeenCalled();
    expect(provider.store.remove).toHaveBeenCalledWith('mykey');
  });

  it("Clears storage", function() {
    var d = jasmine.createSpy('clear');
    provider.clear(d);
    expect(d).toHaveBeenCalled();
    expect(provider.store.clear).toHaveBeenCalled();
  });

});

