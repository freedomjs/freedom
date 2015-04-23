/*jslint sloppy:true*/
/*globals Promise,freedom, crypto, Uint8Array*/

// Environment Test methods
var EnvironmentTest = function () {
};

EnvironmentTest.prototype.testCrypto = function () {
  return new Promise(function (resolve, reject) {
    var view = new Uint8Array(100),
      zeros = 0,
      i;
    try {
      crypto.getRandomValues(view);
    } catch (e) {
      return reject(e.message);
    }
    for (i = 0; i < view.byteLength; i += 1) {
      if (view[i] === 0) {
        zeros += 1;
      }
    }

    if (zeros > 50) {
      reject("Crypto doesn't seem to give real random values");
    } else {
      resolve(true);
    }
  });
};


/** REGISTER **/
if (typeof freedom !== 'undefined') {
  freedom().providePromises(EnvironmentTest);
}
