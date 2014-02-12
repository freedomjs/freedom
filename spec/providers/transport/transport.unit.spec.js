describe("transport.webrtc.json unit tests.", function () {
  var transport, peerconnection, dispatchedEvents;

  // From http://stackoverflow.com/a/11058858/300539
  function str2ab(str) {
    var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
    var bufView = new Uint16Array(buf);
    for (var i=0, strLen=str.length; i<strLen; i++) {
      bufView[i] = str.charCodeAt(i);
    }
    return buf;
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
      core: mockIface([["getId", ["myId"]]]),
      // We can't use mockIface alone, we need to make peerconnection
      // an event target.
      "core.peerconnection": function() {
        var iface = mockIface([
          ["setup", undefined],
          ["send", undefined],
          ["openDataChannel", undefined],
          ["close", undefined]
        ]);
        peerconnection = iface();
        makeEventTarget(peerconnection);
        return peerconnection;
      }
    };
    transport = new WebRTCTransportProvider();
    transport.dispatchEvent = function(event, data) {
      dispatchedEvents[event] = data;
    };

    transport.setup("unit-tests", undefined, postSetup);
    function postSetup() {
      expect(peerconnection.setup).toHaveBeenCalledWith(undefined,
                                                       "unit-tests",
                                                        WebRTCTransportProvider.stun_servers);
      done();
    }
  });

  it("Sends data", function(done) {
    var tag = "test tag";
    var firstMessage = str2ab("Hello World");
    var secondMessage = str2ab("Wello Horld");
    spyOn(transport, "send").and.callThrough();
    transport.send(tag, firstMessage, firstSendCallback);
    function firstSendCallback() {
      expect(transport._tags).toContain(tag);
      expect(transport.send.calls.count()).toBe(2);
      expect(peerconnection.send).toHaveBeenCalledWith({channelLabel: tag,
                                                        buffer: firstMessage});
      // Call a second time, to check path that does not need to
      // create new tag.
      transport.send(tag, secondMessage, secondSendCallback);
    }

    function secondSendCallback() {
      expect(transport.send.calls.count()).toBe(3);
      expect(peerconnection.send).toHaveBeenCalledWith({channelLabel: tag,
                                                        buffer: secondMessage});
      done();
    }
  });

  it("fires on data event", function() {
    var tag = "test";
    var data = str2ab("Hello World");
    var message = {channelLabel: "test",
                   buffer: data};
    peerconnection.fireEvent("onReceived", message);
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
