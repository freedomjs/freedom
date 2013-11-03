describe("util", function() {
  it("iterates over an array", function() {
    var array = [1, 4, 9, 16];
    var sum = 0;
    var ids = [];
    eachReverse(array, function(el, idx) {
      sum += el;
      ids.push(idx);
    });

    expect(sum).toEqual(30);
    expect(ids).toEqual([3, 2, 1, 0]);
  });

  it("locates properties", function() {
    var obj = {};
    Object.defineProperty(obj, "testProp", {});

    expect(hasProp(obj, "testProp")).toBeTruthy();
  });

  it("iterates properties", function() {
    var obj = {
      a: 1,
      b: 2,
      c: 4
    };
    var sum = 0;
    var props = [];
    eachProp(obj, function(val, name) {
      sum += val;
      props.push(name);
    });

    expect(sum).toEqual(7);
    expect(props).toContain('a');
    expect(props).toContain('c');
  });

  describe("mixin", function() {
    var base, other;

    beforeEach(function() {
      base = {value: 1};
      other = {value: 2, other:2};
    });

    it("mixes Objects together", function() {
      mixin(base, other);
      expect(base.value).toEqual(1);
      expect(base.other).toEqual(2);
    });

    it("forcably mixes Objects together", function() {
      mixin(base, other, true);
      expect(base.value).toEqual(2);
      expect(base.other).toEqual(2);
    });

    it("recursively mixes Objects together", function() {
      base.obj = {val: 1, mine: 3};
      other.obj = {val: 2};
      mixin(base, other, true);
      expect(base.obj.val).toEqual(2);
      expect(base.obj.mine).toBeUndefined();
    });
  });

  describe("handleEvents", function() {
    var object, cb;

    beforeEach(function() {
      object = {};
      cb = jasmine.createSpy('cb');
      handleEvents(object);
    });

    it("can execute events", function() {
      object.on('msg', cb);
      object.emit('msg', 'value');
      object.emit('msg', 'value2');
      expect(cb).toHaveBeenCalledWith('value2');
      expect(cb.calls.length).toEqual(2);
    });

    it("can execute events 'Once'", function() {
      object.once('msg', cb);
      object.emit('msg', 'value');
      object.emit('msg', 'value2');
      expect(cb).toHaveBeenCalledWith('value');
      expect(cb.calls.length).toEqual(1);
    });

    it("can execute events conditionally", function() {
      object.once(function(type, val) {
        return val == 'yes';
      }, cb);
      object.emit('msg', 'value');
      object.emit('msg', 'yes');
      object.emit('othermsg', 'yes');
      expect(cb).toHaveBeenCalledWith('yes');
      expect(cb.calls.length).toEqual(1);
    });
  });

  it("Can make urls absolute", function() {
    expect(makeAbsolute("test")).toMatch("test");
    expect(makeAbsolute("test")).toMatch("://");
  });

  it("Can resolve relative paths", function() {
    expect(resolvePath("test.html", "http://test.com/base/name.json")).
      toEqual("http://test.com/base/test.html");
  });
  
  it("Can freeze objects", function () {
    var obj = {
      a: 1,
      b: {
        c: 2
      }
    };
    var frozen = recursiveFreezeObject(obj);
    frozen.a = 5;
    frozen.b = 5;
    frozen.c = 5;
    expect(frozen.a).toEqual(1);
    expect(frozen.b.c).toEqual(2);
  });

  // TODO: Verify appcontext / makeFrame behavior.
});
