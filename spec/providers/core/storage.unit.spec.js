describe("core.storage unprivileged", function() {
  var provider;
  var TIMEOUT = 1000;
  
  beforeEach(function() {
    if (typeof chrome !== "undefined") {
      chrome.storage.local.clear();
      provider = new Storage_chromeStorageLocal({});
    } else {
      localStorage.clear();
      provider = new Storage_unprivileged({});
    }
  });
  
  it("Deals with Keys appropriately", function() {
    var d;
    runs(function() {
      d = jasmine.createSpy('keys');
      provider.keys(d);
    });
    waitsFor("keys return", function() {return (d.callCount > 0);}, TIMEOUT);

    runs(function() {
      expect(d).toHaveBeenCalledWith([]);
      d = jasmine.createSpy('get');
      provider.get('myKey', d);
    });
    waitsFor("get return", function() {return (d.callCount > 0);}, TIMEOUT);
    
    runs(function() {
      expect(d).toHaveBeenCalledWith(null);
      d = jasmine.createSpy('set');
      provider.set('myKey', 'myVal', d);
    });
    waitsFor("set return", function() {return (d.callCount > 0);}, TIMEOUT);
    
    runs(function() {
      expect(d).toHaveBeenCalled();
      d = jasmine.createSpy('get2');
      provider.get('myKey', d);
    });
    waitsFor("get return", function() {return (d.callCount > 0);}, TIMEOUT);

    runs(function() {
      expect(d).toHaveBeenCalledWith('myVal');
      d = jasmine.createSpy('keys2');
      provider.keys(d);
    });
    waitsFor("keys return", function() {return (d.callCount > 0);}, TIMEOUT);

    runs(function() {
      expect(d).toHaveBeenCalledWith(['myKey']);
      d = jasmine.createSpy('rem');
      provider.remove('myKey', d);
    });
    waitsFor("remove return", function() {return (d.callCount > 0);}, TIMEOUT);
    
    runs(function() {
      expect(d).toHaveBeenCalled();
      d = jasmine.createSpy('get3');
      provider.get('myKey', d);
    });
    waitsFor("get return", function() {return (d.callCount > 0);}, TIMEOUT);

    runs(function() {
      expect(d).toHaveBeenCalledWith(null);
    });
  });

  it("Clears Items", function() {
    var d;
    
    runs(function() {
      d = jasmine.createSpy('set');
      provider.set('myKey', 'myVal', d);
      provider.set('otherKey', 'otherVal', d);
      d = jasmine.createSpy('clear');
      provider.clear(d);
    });
    waitsFor("clear return", function() {return (d.callCount > 0);}, TIMEOUT);

    runs(function() {
      expect(d).toHaveBeenCalled();
      d = jasmine.createSpy('get');
      provider.get('myKey', d);
    });
    waitsFor("get return", function() {return (d.callCount > 0);}, TIMEOUT);

    runs(function() {
      expect(d).toHaveBeenCalledWith(null);
      d = jasmine.createSpy('get2');
      provider.get('otherKey', d);
    });
    waitsFor("get return", function() {return (d.callCount > 0);}, TIMEOUT);

    runs(function() {
      expect(d).toHaveBeenCalledWith(null);
    });
  });
});
