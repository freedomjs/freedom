var testUtil = require('../../util');

module.exports = function (pc, dc, setup) {
  'use strict';
  var peercon, datachan;
  beforeEach(function () {
    setup();
    var pcProvider = {
      provide: function(iface) {
        iface().providePromises(pc.provider.bind(pc.provider, {provider:iface}));
      }
    };
    peercon = testUtil.directProviderFor(pcProvider, testUtil.getApis().get(pc.name).definition);
    datachan = testUtil.directProviderFor(dc.provider.bind(dc.provider, {}), testUtil.getApis().get(dc.name).definition);
  });

  it("Sends messages across data channels", function (done) {
    var alice, bob, aliceChannel, bobChannel,
      aliceCandidates = [],
      aliceOffer;
    alice = peercon();
    bob = peercon();
    bob.on('ondatachannel', function (msg) {
      bobChannel = datachan(msg.channel);
      bobChannel.on('onmessage', function (msg) {
        expect(msg.text).toEqual('message from alice');
        alice.close();
        bob.close();
        done();
      });
    });
    bob.on('onicecandidate', function (msg) {
      msg.candidate && alice.addIceCandidate(msg.candidate);
    });
    alice.on('onicecandidate', function (msg) {
      if (!msg.candidate) {
        bob.setRemoteDescription(aliceOffer).then(function () {
          var last;
          while (aliceCandidates.length) {
            last = bob.addIceCandidate(aliceCandidates.shift())
          }
          return last;
        }).then(function () {
          return bob.createAnswer();
        }).then(function (answer) {
          return bob.setLocalDescription(answer).then(function () {return answer; });
        }).then(function (answer) {
          return alice.setRemoteDescription(answer);
        }, function (err) {
          console.error('RTC failed: ',err);
        });
      } else {
        aliceCandidates.push(msg.candidate);
      }
    });
    alice.createDataChannel('channel').then(function (id) {
      aliceChannel = datachan(id);
      aliceChannel.on('onopen', function () {
        aliceChannel.send('message from alice');
      });
      alice.createOffer().then(function (offer) {
        alice.setLocalDescription(offer);
        aliceOffer = offer;
      });
    }, function (err) {
      console.error('RTC failed: ',err);
    });
  });
  
  xit("Checks that Firefox actually signals data channel closing.", function () {
    //TODO: fix below.
  });

  it("Closes Cleanly", function (done) {
    var alice, bob, aliceChannel, bobChannel,
      aliceCandidates = [],
      aliceOffer;
    var onClose = jasmine.createSpy('onclose');
    onClose.and.callFake(function () {
      // TODO: Firefox doesn't yet close remote data channels.
      if (onClose.calls.count() === 2 || (typeof navigator !== 'undefined' &&
          navigator.userAgent.indexOf("Firefox") > 0) ||
          (typeof Components !== 'undefined' /*ffox addon*/)) {
        alice.close();
        bob.close();
        done();
      }
    });

    alice = peercon();
    bob = peercon();
    bob.on('ondatachannel', function (msg) {
      bobChannel = datachan(msg.channel);
      bobChannel.on('onclose', onClose);
      bobChannel.on('onmessage', function (msg) {
        expect(msg.text).toEqual('message from alice');
        bobChannel.close();
      });
    });
    bob.on('onicecandidate', function (msg) {
      msg.candidate && alice.addIceCandidate(msg.candidate);
    });
    alice.on('onicecandidate', function (msg) {
      if (!msg.candidate) {
        bob.setRemoteDescription(aliceOffer).then(function () {
          var last;
          while (aliceCandidates.length) {
            last = bob.addIceCandidate(aliceCandidates.shift())
          }
          return last;
        }).then(function () {
          return bob.createAnswer();
        }).then(function (answer) {
          return bob.setLocalDescription(answer).then(function () {return answer; });
        }).then(function (answer) {
          return alice.setRemoteDescription(answer);
        }, function (err) {
          console.error('RTC failed: ',err);
        });
      } else {
        aliceCandidates.push(msg.candidate);
      }
    });
    alice.createDataChannel('channel').then(function (id) {
      aliceChannel = datachan(id);
      aliceChannel.on('onopen', function () {
        aliceChannel.send('message from alice');
      });
      aliceChannel.on('onclose', onClose);
      alice.createOffer().then(function (offer) {
        alice.setLocalDescription(offer);
        aliceOffer = offer;
      });
    }, function (err) {
      console.error('RTC failed: ',err);
    });
  });

  fit("getStats works", function (done) {
    var alice, bob, aliceCandidates = [], aliceOffer;

    alice = peercon();
    bob = peercon();
    bob.on('onicecandidate', function (msg) {
      msg.candidate && alice.addIceCandidate(msg.candidate);
    });

    var onError = function(e) { throw e; };

    bob.on('oniceconnectionstatechange', function () {
      bob.getIceConnectionState().then(function (state) {
        if (state === 'connected' || state === 'completed') {
          bob.getStats(null).then(function (stats) {
            // This is the actual test, whether getStats returns a valid stats object.
            var numberOfReports = 0;
            for (var id in stats) {
              expect(stats[id].id).toEqual(id);
              expect(stats[id].type).toBeDefined();
              expect(stats[id].timestamp).toBeDefined();
              ++numberOfReports;
            }
            expect(numberOfReports).toBeGreaterThan(0);

            alice.close();
            bob.close();
            done();
          }, onError);
        }
      }, function (err) {
        console.error('RTC failed: ',err);
      });
    });

    // We have to create a data channel because otherwise there is no
    // audio, video, or data, so CreateOffer fails (at least in Firefox).
    alice.on('onicecandidate', function (msg) {
      if (!msg.candidate) {
        bob.setRemoteDescription(aliceOffer).then(function () {
          var last;
          while (aliceCandidates.length) {
            last = bob.addIceCandidate(aliceCandidates.shift())
          }
          return last;
        }).then(function () {
          return bob.createAnswer();
        }).then(function (answer) {
          return bob.setLocalDescription(answer).then(function () {return answer; });
        }).then(function (answer) {
          return alice.setRemoteDescription(answer);
        }, function (err) {
          console.error('RTC failed: ',err);
        });
      } else {
        aliceCandidates.push(msg.candidate);
      }
    });
    alice.createDataChannel('channel').then(function (id) {
      alice.createOffer().then(function (offer) {
        alice.setLocalDescription(offer);
        aliceOffer = offer;
      });
    }, function (err) {
      console.error('RTC failed: ',err);
    });
  });

  it("Signals 'onClose' when created with incorrect parameters", function (done) {
    var badPeer = peercon({
      iceServers: [
        {url: '-invalid-url-'}
      ]
    });
  
    var testOver = done;
    var finished = function() {
      if (testOver) {
        var done = testOver;
        testOver = false;
        done();
      }
    };

    var timeoutId = setTimeout(function () {
      // Option 1. subsequent calls fail.
      badPeer.createOffer().then(function() {
        console.error('Expected call to bad rtc connection to fail.');
      }, finished);
    }, 100);
  
    peercon.onClose(badPeer, function () {
      // Option 2. a constructor error forces a system level on-close.
      clearTimeout(timeoutId);
      finished();
    });
  });
};
