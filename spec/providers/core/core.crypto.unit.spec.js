var Crypt = require('../../../providers/core/core.crypto');

describe("providers/core/Core_crypto", function() {
  var crypt;

  beforeEach(function() {
    crypt = new Crypt.provider();
  });

  it("Generates random buffers!", function(done) {
    crypt.getRandomBytes(50, function(buffer) {
      expect(buffer).toBeDefined();
      var view = new Uint8Array(buffer);
      expect(view.length).toEqual(50);
      var max = 0;
      for (var i = 0; i < view.length; i += 1) {
        if (view[i] > max) {
          max = view[i];
        }
      }
      expect(max).toBeGreaterThan(0);
      done();
    });
  });
});
