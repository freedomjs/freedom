var testUtil = require('../../util');
var Provider = require('../../../providers/storage/isolated/storage.isolated');
var PromiseCompat = require('es6-promise').Promise;

describe("unit: storage.isolated.json", function () {
  var provider, finishCore, promise;
  beforeEach(function() {
    // Comment for log messages.
    spyOn(console, "log");
    promise = new PromiseCompat(function(resolve) {
      finishCore = resolve;
    });

    freedom = {
      core: testUtil.mockIface([['getId', promise]]),
      'core.storage': testUtil.mockIface([
        ['keys', ['myId;Test', 'otherTest']],
        ['get', 'value'],
        ['set', undefined],
        ['remove', undefined]
      ])
    };
    provider = new Provider.provider(null);
  });

  it("returns owned keys", function(done) {
    finishCore(['myId']);
    promise.then(function() {
      var d = function(result) {
        expect(provider.store.keys).toHaveBeenCalled();
        expect(result).toEqual(['Test']);
        done();
      };
      provider.keys(d);
    });
  });

  it("gets saved items", function(done) {
    finishCore(['myId']);
    var d = function(result) {
      expect(provider.store.get).toHaveBeenCalledWith('myId;mykey');
      expect(result).toEqual('value');
      done();
    };
    provider.get('mykey', d);
  });

  it("sets items", function(done) {
    finishCore(['myId']);
    var d = function() {
      expect(provider.store.set).toHaveBeenCalledWith('myId;mykey', 'myval');
      done();
    };
    provider.set('mykey', 'myval', d);
  });

  it("Removes items", function(done) {
    finishCore(['myId']);
    var d = function() {
      expect(provider.store.remove).toHaveBeenCalledWith('myId;mykey');
      done();
    };
    provider.remove('mykey', d);
  });

  it("Clears storage", function(done) {
    finishCore(['myId']);
    var d = function() {
      expect(provider.store.remove).toHaveBeenCalled();
      done();
    };
    provider.clear(d);
  });

  it("Buffers until core is ready", function(done) {
    var cb = jasmine.createSpy('buffer');
    var d = function() {
      done();
    };
    provider.keys(cb);
    provider.set('mykey', 'myval', cb);
    provider.get('mykey', cb);
    provider.remove('mykey', d);
    setTimeout(function() {
      expect(cb).not.toHaveBeenCalled();
      finishCore(['myId']);
    }, 0);
  });
});
