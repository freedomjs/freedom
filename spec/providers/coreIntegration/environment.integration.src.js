/*jslint node:true*/
/*globals beforeEach, afterEach, it, expect*/
var testUtil = require('../../util');

module.exports = function (setup) {
  'use strict';
  var Handle, moduleEnv;

  beforeEach(function (done) {
    setup();
    testUtil.setupModule('relative://spec/helper/environment.json')
      .then(function (Mod) {
        Handle = Mod;
        moduleEnv = new Mod();
        done();
      });
  });

  afterEach(function (done) {
    Handle.close();
    testUtil.cleanupIframes();
    done();
  });

  it("can crypto.getRandomValues", function (done) {
    moduleEnv.testCrypto().then(function (ret) {
      expect(ret).toEqual(true);
      done();
    }, function (ret) {
      expect(ret).toEqual(true);
      expect(true).toEqual(false);
      done();
    });
  });

  it("exposes dynamic require functionality", function (done) {
    moduleEnv.testRequire(true).then(function (ret) {
      expect(ret).toEqual(true);
      done();
    }, function (ret) {
      expect(ret).toEqual(true);
      expect(true).toEqual(false);
      done();
    });
  });

  it("hanles dynamic require failures", function (done) {
    moduleEnv.testRequire(false).then(function (ret) {
      expect(ret).toEqual(true);
      done();
    }, function (ret) {
      expect(ret).toEqual(true);
      expect(true).toEqual(false);
      done();
    });
  });
};
