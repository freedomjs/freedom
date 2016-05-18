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

EnvironmentTest.prototype.testRequire = function (url) {
  return freedom.core().require(url).then(function (Dep) {
    if (!Dep) {
      return 'then returned no object';
    }
    var d = new Dep();
    if (typeof d.on === 'function') {
      return 'success';
    }
    return 'method on not found';
  }, function (err) {
    return 'failed';
  });
};

EnvironmentTest.prototype.testBrokenDependency = function () {
  var p = new Promise(function(resolve, reject) {
    freedom['broken'].onError(resolve.bind(null, 'failed'));
  });
  var x = freedom['broken']();
  return p;
};


/** REGISTER **/
if (typeof freedom !== 'undefined') {
  freedom().providePromises(EnvironmentTest);
}
