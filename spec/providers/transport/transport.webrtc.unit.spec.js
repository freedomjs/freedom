var testUtil = require('../../util');
var util = require('../../../src/util');
var Provider = require('../../../providers/transport/webrtc/transport.webrtc');

describe("unit: transport.webrtc.json", function () {
  var transport, peerconnection, dispatchedEvents;
  var sizeToBuffer = Provider.provider.prototype._sizeToBuffer;
  var bufferToSize = Provider.provider.prototype._bufferToSize;
  function defineSlice(arrayBuffer) {
    arrayBuffer.slice = function(begin, end) {
      begin = (begin|0) || 0;
      var num = this.byteLength;
      end = end === (void 0) ? num : (end|0);

      // Handle negative values.
      if (begin < 0) begin += num;
      if (end < 0) end += num;

      if (num === 0 || begin >= num || begin >= end) {
        return new ArrayBuffer(0);
      }

      var length = Math.min(num - begin, end - begin);
      var target = new ArrayBuffer(length);
      var targetArray = new Uint8Array(target);
      targetArray.set(new Uint8Array(this, begin, length));
      return target;
    };
  }


  // Adds "on" listener that can register event listeners, which can
  // later be fired through "fireEvent". It is expected that listeners
  // will be regstered before events are fired.
  function makeEventTarget(target) {
    var listeners = {};
    target.on = function(event, func) {
      if (listeners[event]) {
        listeners[event].push(func);
      } else {
        listeners[event] = [func];
      }
    };
    target.fireEvent = function(event, data) {
      expect(target.on).toHaveBeenCalledWith(event, jasmine.any(Function));
      listeners[event].forEach(function(listener) {
        listener(data);
      });
    };
    target.removeListeners = function() {
      listeners = {};
    };
    spyOn(target, "on").and.callThrough();
  }

  beforeEach(function(done) {
    dispatchedEvents = {};
    freedom = {
      core: testUtil.mockIface([["getId", ["myId"]]]),
      // We can't use mockIface alone, we need to make peerconnection
      // an event target.
      "core.peerconnection": function() {
        var iface = testUtil.mockIface([
          ["setup", undefined],
          ["send", undefined],
          ["openDataChannel", undefined],
          ["close", undefined],
          ["getBufferedAmount", 0]
        ]);
        peerconnection = iface();
        makeEventTarget(peerconnection);
        return peerconnection;
      }
    };
    transport = new Provider.provider();
    transport.dispatchEvent = function(event, data) {
      dispatchedEvents[event] = data;
    };

    transport.setup("unit-tests", undefined, postSetup);
    function postSetup() {
      expect(peerconnection.setup).toHaveBeenCalledWith(undefined,
                                                       "unit-tests",
                                                        Provider.provider.stun_servers,
                                                        false);
      done();
    }
  });

  it("Sends data", function(done) {
    var tag = "test tag";
    var firstMessage = util.str2ab("Hello World");
    var secondMessage = util.str2ab("Wello Horld");
    spyOn(transport, "send").and.callThrough();
    transport.send(tag, firstMessage, firstSendCallback);
    function firstSendCallback() {
      var expectedMessage = new ArrayBuffer(firstMessage.byteLength + 8);
      var view = new Uint8Array(expectedMessage);
      view.set(sizeToBuffer(firstMessage.byteLength));
      view.set(firstMessage, 8);
      expect(transport._tags).toContain(tag);
      expect(transport.send.calls.count()).toBe(2);
      expect(peerconnection.send).
        toHaveBeenCalledWith({channelLabel: tag, buffer: expectedMessage});
      // Call a second time, to check path that does not need to
      // create new tag.
      transport.send(tag, secondMessage, secondSendCallback);
    }

    function secondSendCallback() {
      var expectedMessage = new ArrayBuffer(secondMessage.byteLength + 8);
      var view = new Uint8Array(expectedMessage);
      view.set(sizeToBuffer(secondMessage.byteLength));
      view.set(secondMessage, 8);
      expect(transport.send.calls.count()).toBe(3);
      expect(peerconnection.send).
        toHaveBeenCalledWith({channelLabel: tag, buffer: expectedMessage});
      done();
    }
  });

  function printBuffer(buffer) {
    var test = new Uint8Array(buffer);
    for (var i = 0; i < buffer.byteLength; i++) {
      console.log(test[i]);
    }
  }

  xit("fires on data event", function() {
    var tag = "test";
    var data = util.str2ab("Hello World");
    var sizeAsBuffer = sizeToBuffer(data.byteLength);
    var toSend = new ArrayBuffer(data.byteLength + 8);
    defineSlice(toSend);
    var view = new Uint8Array(toSend);
    view.set(sizeAsBuffer);
    view.set(data, 8);
    var message = {channelLabel: "test",
                   buffer: toSend};
    transport.onData(message);
    console.info(dispatchedEvents.onData.data.byteLength);
    console.info(util.ab2str(dispatchedEvents.onData.data));
    expect(dispatchedEvents.onData).toEqual({tag: tag,
                                             data: data});
  });

  it("closes", function(done) {
    transport.close(closeCallback);
    function closeCallback() {
      expect(peerconnection.close).toHaveBeenCalled();
      done();
    }
  });

  it("fires onClose event", function() {
    peerconnection.fireEvent("onClose", undefined);
    expect(dispatchedEvents.onClose).toBeDefined();
  });
});
