/*jslint node:true,bitwise:true*/
/*globals Uint8Array, beforeEach, afterEach, it, expect, jasmine */
var testUtil = require('../../util');
var PromiseCompat = require('es6-promise').Promise;

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
      dispatch.gotMessageAsync('onData', [], function (msg) {
        expect(written).toEqual(true);
        expect(dispatch.gotMessage('onData', [])).not.toEqual(false);
        socket.close(done);
      });
    });
  });

  it("Closes socket and open new one on the same port", function (done) {
    socket.listen('127.0.0.1', 9981, function () {
      socket.close(function () {
        socket.listen('127.0.0.1', 9981, function () {
          expect(true).toEqual(true);
          socket.close(done);
        });
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

    socket.getInfo(function (info) {
      expect(info.connected).toEqual(false);
      expect(info.localPort).not.toBeDefined();
    });
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

  it("Fires onConnection and onDisconnect events", function (done) {
    var cspy = jasmine.createSpy('client'),
        client,
        onConnectionReceived,
        onDispatch,
        receiver;

    onDispatch = function (evt, msg) {
      expect(evt).toEqual('onDisconnect');
      expect(onConnectionReceived).toEqual(true);
      client.getInfo(function (info) {
        expect(info.connected).toEqual(false);
      });
      socket.close(done);
    };
    dispatch.gotMessageAsync('onConnection', [], function (msg) {
      onConnectionReceived = true;
      expect(msg.socket).toBeDefined();
      receiver = new provider.provider(undefined, onDispatch, msg.socket);
      client.close(function () {});
    });
    socket.listen('127.0.0.1', 9981, function () {
      client = new provider.provider(undefined, cspy);
      client.connect('127.0.0.1', 9981, function () { });
    });
  });

  it("Pauses and resumes", function (done) {
    // TODO: this test breaks in node (runs code after done())
    socket.connect('www.google.com', 80, function () {
      var paused = false;
      var messageCount = 0;
      dispatch.on('onMessage', function (msg) {
        if (!('data' in msg)) {
          // Not an 'onData' message.
          return;
        }

        // One onData is allowed during pause due to https://crbug.com/360026.
        ++messageCount;
        if (paused && messageCount === 1) {
          return;
        }

        // Apart from the above exception, check that data doesn't arrive until
        // after the socket resumes.
        expect(paused).toEqual(false);
        socket.close(done);
      });

      socket.pause(function () {
        paused = true;
        // This URL is selected to be a file large enough to generate
        // multiple onData events.
        socket.write(
          rawStringToBuffer('GET /images/srpr/logo11w.png HTTP/1.0\n\n'),
          function (okay) {});

        // Wait a second before unpausing.  Data received in this second
        // will fail the expectation that paused is false in gotMessageAsync.
        setTimeout(function () {
          // The observed behavior is that the next packet is received after
          // the call to resume, but before resume returns.
          socket.resume(function () {});
          paused = false;
        }, 1000);
      });
    });
  });

  it("Secures a socket", function (done) {
    // TODO - prepareSecure test, if Chrome isn't fixing that soon
    socket.connect('www.google.com', 443, function () {
      socket.secure(function() {
        socket.getInfo(function (info) {
          expect(info.connected).toEqual(true);
          socket.close(done);
        });
      });
    });
  });

  it("Gives error when securing a disconnected socket", function(done) {
    socket.secure(function (success, err) {
      expect(err.errcode).toEqual('NOT_CONNECTED');
      done();
    });
  });

  it("Gives error when connecting to invalid domain", function (done) {
    socket.connect('www.domainexiststobreakourtests.gov', 80,
                   function (success, err) {
                     var allowedErrors = ['CONNECTION_FAILED',
                                          'NAME_NOT_RESOLVED'];
                     expect(allowedErrors).toContain(err.errcode);
                     done();
                   });
  });

  it("Gives error when writing a disconnected socket", function(done) {
    socket.write(rawStringToBuffer(''), function (success, err) {
      expect(err.errcode).toEqual('NOT_CONNECTED');
      done();
    });
  });

  it("Gives error when closing a disconnected socket", function(done) {
    socket.close(function (success, err) {
      expect(err.errcode).toEqual('SOCKET_CLOSED');
      done();
    });
  });

  it("Gives error when listening on already allocated socket", function(done) {
    socket.listen('127.0.0.1', 9981, function () {
      socket.listen('127.0.0.1', 9981, function (success, err) {
        expect(err.errcode).toEqual('ALREADY_CONNECTED');
        socket.close(done);
      });
    });
  });

  it("Socket reusing id of closed socket is also closed", function(done) {
    var cspy = jasmine.createSpy('client'),
        client,
        socketCopy;

    dispatch.gotMessageAsync('onConnection', [], function (msg) {
      expect(msg.socket).toBeDefined();
      client.close(function () {
        socketCopy = new provider.provider(undefined, function () {},
                                           msg.socket);
        socketCopy.getInfo(function (info) {
          // TODO consider changing implementation to give more explicit failure
          expect(info.connected).toEqual(false);
          done();
        });
      });
    });
    socket.listen('127.0.0.1', 9981, function () {
      client = new provider.provider(undefined, cspy);
      client.connect('127.0.0.1', 9981, function () {});
    });

  });
};
