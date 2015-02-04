/*jslint node:true,bitwise:true*/
/*globals Uint8Array, beforeEach, afterEach, it, expect, jasmine */
var testUtil = require('../../util');
var PromiseCompat = require('es6-promise').Promise

module.exports = function (provider, setup) {
  'use strict';
  var socket, dispatch;

  beforeEach(function () {
    setup();
    dispatch = testUtil.createTestPort('msgs');
    socket = new provider.provider(undefined, dispatch.onMessage.bind(dispatch));
  });

  function rawStringToBuffer(str) {
    var idx, len = str.length, arr = [];
    for (idx = 0; idx < len; idx += 1) {
      arr[idx] = str.charCodeAt(idx) & 0xFF;
    }
    return new Uint8Array(arr).buffer;
  }

  it("Works as a Client", function (done) {
    socket.connect('www.google.com', 80, function () {
      var written = false;
      socket.write(rawStringToBuffer('GET / HTTP/1.0\n\n'), function (okay) {
        written = true;
      });
      dispatch.gotMessageAsync('onData', [], function(msg) {
        expect(written).toBe(true);
        expect(dispatch.gotMessage('onData', [])).not.toEqual(false);
        socket.close(done);
      });
    });
  });

  it("Gets info on client & server sockets", function (done) {
    var cspy = jasmine.createSpy('client'),
      client,
      onconnect = function () {
        client.getInfo(function (info) {
          expect(info.localPort).toBeGreaterThan(1023);
          PromiseCompat.all([
            client.close(function () {}),
            socket.close(function () {}),
            done()]);
        });
      };

    socket.listen('127.0.0.1', 0, function () {
      socket.getInfo(function (info) {
        expect(info.localPort).toBeGreaterThan(1023);
        client = new provider.provider(undefined, cspy);
        client.connect('127.0.0.1', info.localPort, onconnect);
      });
    });
  });

  it("Sends from Client to Server", function (done) {
    var cspy = jasmine.createSpy('client'),
      client,
      receiver,
      onDispatch,
      onconnect;

    onDispatch = function (evt, msg) {
      if (evt === 'onDisconnect') {
        return;
      }
      expect(evt).toEqual('onData');
      expect(msg.data.byteLength).toEqual(10);
      PromiseCompat.all([
        socket.close(function () {}),
        client.close(function () {}),
        receiver.close(function () {}),
        done()]);
    };
    dispatch.gotMessageAsync('onConnection', [], function (msg) {
      expect(msg.socket).toBeDefined();
      receiver = new provider.provider(undefined, onDispatch, msg.socket);
    });
    onconnect = function () {
      var buf = new Uint8Array(10);
      client.write(buf.buffer, function () {});
    };
    socket.listen('127.0.0.1', 9981, function () {
      client = new provider.provider(undefined, cspy);
      client.connect('127.0.0.1', 9981, onconnect);
    });
  });

  it("Gives error when connecting to invalid domain", function (done) {
    socket.connect('www.domainexistsbecausesomeonepaidmoneytobreakourtests.gov', 80,
      function (success, err) {
        expect(err.errcode).toBe('CONNECTION_FAILED');
        done();
      });
  });

  // TODO: add tests for tcpsocket.secure, accepting multiple.
};
