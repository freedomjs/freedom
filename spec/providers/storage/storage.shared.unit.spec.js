var testUtil = require('../../util');
var Provider = require('../../../providers/storage/shared/storage.shared');

describe("unit: storage.shared.json", function () {
  var provider;
  beforeEach(function() {
    freedom = {
      core: testUtil.mockIface([['getId', ['myId']]]),
      'core.storage': testUtil.mockIface([
        ['keys', ['myId;Test', 'otherTest']],
        ['get', 'value'],
        ['set', undefined],
        ['remove', undefined],
        ['clear', undefined]
      ])
    };
    provider = new Provider.provider();
  });

  it("returns owned keys", function(done) {
    var d = jasmine.createSpy('keys');
    provider.keys(d);
    setTimeout(function() {
      expect(provider.store.keys).toHaveBeenCalled();
      expect(d).toHaveBeenCalledWith(['myId;Test', 'otherTest']);
      done();
    }, 0);
  });

  it("gets saved items", function(done) {
    var d = jasmine.createSpy('get');
    provider.get('mykey', d);
    setTimeout(function() {
      expect(d).toHaveBeenCalledWith('value');
      expect(provider.store.get).toHaveBeenCalledWith('mykey');
      done();
    }, 0);
  });

  it("sets items", function(done) {
    var d = jasmine.createSpy('set');
    provider.set('mykey', 'myval', d);
    setTimeout(function() {
      expect(d).toHaveBeenCalled();
      expect(provider.store.set).toHaveBeenCalledWith('mykey', 'myval');
      done();
    }, 0);
  });

  it("Removes items", function(done) {
    var d = jasmine.createSpy('remove');
    provider.remove('mykey', d);
    setTimeout(function() {
      expect(d).toHaveBeenCalled();
      expect(provider.store.remove).toHaveBeenCalledWith('mykey');
      done();
    });
  });

  it("Clears storage", function(done) {
    var d = jasmine.createSpy('clear');
    provider.clear(d);
    setTimeout(function() {
      expect(d).toHaveBeenCalled();
      expect(provider.store.clear).toHaveBeenCalled();
      done();
    });
  });

});

