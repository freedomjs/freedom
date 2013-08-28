describe("freedom", function() {
  var xhr = new XMLHttpRequest();
  xhr.open("get", "freedom.js", false);
  xhr.overrideMimeType("text/javascript; charset=utf-8");
  xhr.send(null);
  var freedom_src = xhr.responseText;

  var freedom;
  beforeEach(function() {
    var global = {
      console: {
        log: function() {}
      }
    };
    freedom = setup(global, undefined, {
      manifest: "spec/helper/manifest.json",
      portType: 'Frame',
      inject: "https://raw.github.com/kriskowal/es5-shim/master/es5-shim.js",
      src: freedom_src
    });
  });

  it("creates modules", function() {
    var cb = jasmine.createSpy('cb');
    var called = false;
    runs(function() {
      freedom.on('output', cb);
      freedom.on('output', function() {
        called = true;
      });
      freedom.emit('input', 'roundtrip');
    });

    waitsFor(function() {
      return called;
    }, "Freedom should return input", 1000);

    runs(function() {
      expect(cb).toHaveBeenCalledWith('roundtrip');
    });
  });
});
