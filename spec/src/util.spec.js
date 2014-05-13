describe("util", function() {
  it("iterates over an array", function() {
    var array = [1, 4, 9, 16];
    var sum = 0;
    var ids = [];
    fdom.util.eachReverse(array, function(el, idx) {
      sum += el;
      ids.push(idx);
    });

    expect(sum).toEqual(30);
    expect(ids).toEqual([3, 2, 1, 0]);

    fdom.util.eachReverse(false, function() {
      sum = 100;
    });
    expect(sum).toEqual(30);
  });

  it("stops iterating if needed", function() {
    var array = [1, 4, 9, 16];
    var sum = 0;
    fdom.util.eachReverse(array, function(el) {
      sum += el;
      return el % 2 != 0;
    });
    expect(sum).toEqual(25);
  });

  it("locates properties", function() {
    var obj = {};
    Object.defineProperty(obj, "testProp", {});

    expect(fdom.util.hasProp(obj, "testProp")).toBeTruthy();
  });

  it("iterates properties", function() {
    var obj = {
      a: 1,
      b: 2,
      c: 4
    };
    var sum = 0;
    var props = [];
    fdom.util.eachProp(obj, function(val, name) {
      sum += val;
      props.push(name);
    });

    expect(sum).toEqual(7);
    expect(props).toContain('a');
    expect(props).toContain('c');

    sum = 0;
    fdom.util.eachProp(obj, function(val, name) {
      sum += val;
      return name === 'b'
    });
    expect(sum).toEqual(3);
  });

  describe("mixin", function() {
    var base, other;

    beforeEach(function() {
      base = {value: 1};
      other = {value: 2, other:2};
    });

    it("mixes Objects together", function() {
      fdom.util.mixin(base, other);
      expect(base.value).toEqual(1);
      expect(base.other).toEqual(2);
    });

    it("forcably mixes Objects together", function() {
      fdom.util.mixin(base, other, true);
      expect(base.value).toEqual(2);
      expect(base.other).toEqual(2);
    });

    it("recursively mixes Objects together", function() {
      base.obj = {val: 1, mine: 3};
      other.obj = {val: 2};
      fdom.util.mixin(base, other, true);
      expect(base.obj.val).toEqual(2);
      expect(base.obj.mine).toBeUndefined();
    });

    it("handles degenerate mixins", function() {
      var result = fdom.util.mixin(base, null, true);
      expect(result).toEqual({value: 1});
    });
  });

  describe("getId", function() {
    it("creates unique IDs", function() {
      var id1 = fdom.util.getId();
      var id2 = fdom.util.getId();
      expect(id1).not.toEqual(id2);
    });
  });

  describe("handleEvents", function() {
    var object, cb;

    beforeEach(function() {
      object = {};
      cb = jasmine.createSpy('cb');
      fdom.util.handleEvents(object);
    });

    it("can execute events", function() {
      object.on('msg', cb);
      object.emit('msg', 'value');
      object.emit('msg', 'value2');
      expect(cb).toHaveBeenCalledWith('value2');
      expect(cb.calls.count()).toEqual(2);
    });

    it("can execute events 'Once'", function() {
      object.once('msg', cb);
      object.emit('msg', 'value');
      object.emit('msg', 'value2');
      expect(cb).toHaveBeenCalledWith('value');
      expect(cb.calls.count()).toEqual(1);
    });

    it("can execute events conditionally", function() {
      object.once(function(type, val) {
        return val == 'yes';
      }, cb);
      object.emit('msg', 'value');
      object.emit('msg', 'yes');
      object.emit('othermsg', 'yes');
      expect(cb).toHaveBeenCalledWith('yes');
      expect(cb.calls.count()).toEqual(1);
    });
    
    it("can requeue conditioanl events", function() {
      var f = function(m) {
        m == 'ok' ? cb() : object.once('msg', f);
      };
      object.once('msg', f);
      object.emit('msg', 'bad');
      expect(cb).not.toHaveBeenCalled();
      object.emit('msg', 'ok');
      expect(cb).toHaveBeenCalled();
    });

    it("can unregister events", function() {
      object.on('msg', cb);
      object.off('msg', cb);
      object.emit('msg', 'value');
      expect(cb).not.toHaveBeenCalled();
    });

    it("Can cleanup all events", function() {
      object.on('msg', cb);
      object.on('other', cb);
      object.off();
      object.emit('msg', 'value');
      expect(cb).not.toHaveBeenCalled();
    });

    it("can unregister conditional events", function() {
      var func = function(type, val) {
        return val == 'yes';
      };
      object.once(func, cb);
      object.off(func);
      object.emit('msg', 'yes');
      expect(cb).not.toHaveBeenCalled();
    })
  });

  describe("ModuleContext", function() {
    it("Warns when source has been mangled", function() {
      spyOn(fdom.debug, "error");
      var resp = fdom.util.forceModuleContext("");
      expect(fdom.debug.error).toHaveBeenCalled();
      expect(resp).toBeUndefined();
    });
  });
});
