describe("core.storage unprivileged", function() {
  var provider;
  
  beforeEach(function() {
    provider = new Storage_unprivileged({});
  });
  
  it("Deals with Keys appropriately", function() {
    var d = jasmine.createSpy('keys');
    provider.keys(d);
    expect(d).toHaveBeenCalledWith([]);

    d = jasmine.createSpy('get');
    provider.get('myKey', d);
    expect(d).toHaveBeenCalledWith(null);

    d = jasmine.createSpy('set');
    provider.set('myKey', 'myVal', d);
    expect(d).toHaveBeenCalled();

    d = jasmine.createSpy('get2');
    provider.get('myKey', d);
    expect(d).toHaveBeenCalledWith('myVal');

    d = jasmine.createSpy('keys2');
    provider.keys(d);
    expect(d).toHaveBeenCalledWith(['myKey']);

    d = jasmine.createSpy('rem');
    provider.remove('myKey', d);
    expect(d).toHaveBeenCalled();

    d = jasmine.createSpy('get3');
    provider.get('myKey', d);
    expect(d).toHaveBeenCalledWith(null);
  });

  it("Clears Items", function() {
    var d = jasmine.createSpy('set');
    provider.set('myKey', 'myVal', d);
    provider.set('otherKey', 'otherVal', d);

    d = jasmine.createSpy('clear');
    provider.clear(d);
    expect(d).toHaveBeenCalled();

    d = jasmine.createSpy('get');
    provider.get('myKey', d);
    expect(d).toHaveBeenCalledWith(null);

    d = jasmine.createSpy('get2');
    provider.get('otherKey', d);
    expect(d).toHaveBeenCalledWith(null);
  });
});