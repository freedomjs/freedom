describe("unit: storage.isolated.json", function () {
  var provider;
  beforeEach(function() {
    // Comment for log messages.
    spyOn(console, "log");

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

  it("returns owned keys", function(done) {
    var d = jasmine.createSpy('keys');
    provider.keys(d);
    setTimeout(function() {
      expect(provider.store.keys).toHaveBeenCalled();
      expect(d).toHaveBeenCalledWith(['Test']);
      done();
    }, 0);
  });

  it("gets saved items", function(done) {
    var d = jasmine.createSpy('get');
    provider.get('mykey', d);
    setTimeout(function() {
      expect(d).toHaveBeenCalledWith('value');
      expect(provider.store.get).toHaveBeenCalledWith('myId;mykey');
      done();
    }, 0);
  });

  it("sets items", function(done) {
    var d = jasmine.createSpy('set');
    provider.set('mykey', 'myval', d);
    setTimeout(function() {
      expect(d).toHaveBeenCalled();
      expect(provider.store.set).toHaveBeenCalledWith('myId;mykey', 'myval');
      done();
    }, 0);
  });

  it("Removes items", function(done) {
    var d = jasmine.createSpy('remove');
    provider.remove('mykey', d);
    setTimeout(function() {
      expect(d).toHaveBeenCalled();
      expect(provider.store.remove).toHaveBeenCalledWith('myId;mykey');
      done();
    }, 0);
  });

  it("Clears storage", function(done) {
    var d = jasmine.createSpy('clear');
    provider.clear(d);
    setTimeout(function() {
      expect(d).toHaveBeenCalled();
      expect(provider.store.remove).toHaveBeenCalled();
      done();
    }, 0);
  });
});
