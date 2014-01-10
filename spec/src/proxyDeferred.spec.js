describe("fdom.proxy.Callbacks", function() {
  var callback;

  beforeEach(function() {
    callback = fdom.proxy.Callbacks();
  });

  it("Holds a list of Callbacks", function() {
    var f = jasmine.createSpy('spy');
    callback.add(f);

    expect(callback.fired()).toEqual(false);
    callback.fire();
    expect(f).toHaveBeenCalled();
    expect(callback.fired()).toEqual(true);
  });

  it("Adds Callbacks reasonably", function() {
    var f = jasmine.createSpy('spy');
    callback.add(f);
    // Should only be called once.
    callback.add(f);

    callback.fire();
    expect(f).toHaveBeenCalled();
    expect(f.callCount).toEqual(1);    
  });
 
  it("Removes Callbacks reasonably", function() {
    var f = jasmine.createSpy('spy');
    callback.add(f);
    expect(callback.has(f)).toEqual(true);
    callback.remove(f);
    expect(callback.has(f)).toEqual(false);

    callback.add(f);
    callback.empty();
    expect(callback.has(f)).toEqual(false);

    callback.fire();
    expect(f).not.toHaveBeenCalled();
  });

  it("Can prevent firing or changing", function() {
    var f = jasmine.createSpy('spy');
    callback.add(f);
    expect(callback.has(f)).toEqual(true);

    callback.disable();
    expect(callback.disabled()).toEqual(true);
    callback.fire();

    expect(f).not.toHaveBeenCalled();    
  });

  it("Supports firing multiple times.", function() {
    callback = fdom.proxy.Callbacks(true);
    var f = jasmine.createSpy('a');
    var g = jasmine.createSpy('b');
    var h = jasmine.createSpy('c');

    callback.add(f);
    f.andCallFake(function() {
      callback.add(h);
      callback.remove(f);
      callback.fire('b');
    });
    var g = jasmine.createSpy('b');
    callback.add(g);

    callback.fire('a');
    expect(f).toHaveBeenCalledWith('a');
    expect(f).not.toHaveBeenCalledWith('b');
    expect(g).toHaveBeenCalledWith('a');
    expect(g).toHaveBeenCalledWith('b');
    expect(h).toHaveBeenCalledWith('a');
    expect(h).toHaveBeenCalledWith('b');
  })
});

describe("fdom.proxy.Deferred", function() {
  var deferred;
  beforeEach(function() {
    deferred = fdom.proxy.Deferred();
  });

  it("Allows an event to be delayed", function() {
    var spy = jasmine.createSpy('x');

    var promise = deferred.promise();
    promise.done(spy);
    expect(spy).not.toHaveBeenCalled();
    expect(promise.state()).toEqual('pending');
    deferred.resolve();
    expect(spy).toHaveBeenCalled();
    expect(promise.state()).toEqual('resolved');
  });

  it("Allows chaining of events", function() {
    var spy = jasmine.createSpy('then');
    var spy2 = jasmine.createSpy('normal');

    var filtered = deferred.then(function(v) {
      spy();
      return v * 2;
    });

    filtered.done(spy2);

    deferred.resolve(2);
    expect(spy2).toHaveBeenCalledWith(4);
    expect(spy).toHaveBeenCalled();
  });
});
