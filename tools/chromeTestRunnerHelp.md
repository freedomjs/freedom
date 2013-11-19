HOW TO USE THE CHROME TEST RUNNER
=================================
(Paths are from the repo root dir)

- Run the shell script at /tools/chromeTestRunner.sh
- Run it with the -h or --help flags for a list of optional arguments


NOTES ON WRITING TESTS
======================

- Helper FreeDOM backends can be placed in /spec/helper and then instantiated
  in your test using the instructions below.


USING HELPER BACKENDS FOR TESTING
=================================

The following is an example test that uses a helper FreeDOM backend.

- The necessary parts are the beforeEach and afterEach which together load and
  destroy a FreeDOM instance for each test
- Any helper backends should be placed in /spec/helper/ and will become
  available in the chrome app at /runtimeIncludes/helper/

    describe("freedom", function() {
      var freedomInstance1;

      beforeEach(function() {
        var freedom_src = jasmine.getGlobal().freedom_src;

        freedomInstance1 = setup(jasmine.getGlobal(), undefined, {
          manifest: "runtimeIncludes/helper/manifest.json",
          portType: 'Frame',
          src: freedom_src
        });
      });
      
      afterEach(function() {
        var frames = document.getElementsByTagName('iframe');
        for (var i = 0; i < frames.length; i++) {
          frames[i].parentNode.removeChild(frames[i]);
        }
      });


      it("should support on and emit message passing", function() {
        var cb = jasmine.createSpy('cb');
        var called = false;
        runs(function() {
          freedomInstance1.on('output', cb);
          freedomInstance1.on('output', function() {
            called = true;
          });
          freedomInstance1.emit('input', 'roundtrip');
        });

        waitsFor(function() {
          return called;
        }, "Freedom should return input", 4000);

        runs(function() {
          expect(cb).toHaveBeenCalledWith('roundtrip');
        });
      });
    });
