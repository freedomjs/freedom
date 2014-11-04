module.exports = function(provider, setup) {
  var socket, serverDispatchEvent;
  const listenPort = 8082, sendPort = 8083;
  beforeEach(function () {
    setup();
    serverDispatchEvent = jasmine.createSpy("dispatchEvent");
    socket = new provider.provider(undefined, serverDispatchEvent);
  });

  it("Connects, has state, and sends/receives data", function (done) {
    // Currently a copy of 'receives data' unit test from firefox, change it
    const sendString = "Hello World",
          sendBuffer = str2ab(sendString),
          clientDispatchEvent = jasmine.createSpy("dispatchEvent"),
          sendingSocket = new provider.provider(undefined, clientDispatchEvent),
          sendContinuation = jasmine.createSpy("sendContinuation"),
          bindContinuation = jasmine.createSpy("bindContinuation"),
          stateContinuation = jasmine.createSpy("stateContinuation"),
          destroyContinuation = jasmine.createSpy("destroyContinuation");
    // Set up connections
    socket.bind("127.0.0.1", listenPort, bindContinuation);
    setTimeout(function() {
      expect(bindContinuation).toHaveBeenCalledWith(0);
      done();
    }, 500);
    sendingSocket.bind("127.0.0.1", sendPort, bindContinuation);
    setTimeout(function() {
      expect(bindContinuation.calls.count()).toEqual(2);
      expect(bindContinuation.calls.mostRecent().args[0]).toEqual(0);
      done();
    }, 500);

    // Check socket state
    const listenState = {"localAddress": "127.0.0.1", "localPort": listenPort},
          sendState = {"localAddress": "127.0.0.1", "localPort": sendPort};
    setTimeout(function() {
      socket.getInfo(stateContinuation);
      setTimeout(function() {
        expect(stateContinuation).toHaveBeenCalledWith(listenState);
        done();
      }, 250);
      done();
    }, 250);
    setTimeout(function() {
      sendingSocket.getInfo(stateContinuation);
      setTimeout(function() {
        expect(stateContinuation).toHaveBeenCalledWith(sendState);
        expect(stateContinuation.calls.count()).toEqual(2);
        done();
      }, 250);
      done();
    }, 250);

    // Check data sending
    serverDispatchEvent.and.callFake(function fakeDispatchEvent(event, data) {
      expect(event).toEqual("onData");
      expect(data.resultCode).toEqual(0);
      expect(data.port).toEqual(sendPort);
      expect(data.data).toEqual(sendBuffer);
      done();
    });
    sendingSocket.sendTo(sendBuffer, "127.0.0.1",
                         listenPort, sendContinuation);
    setTimeout(function() {
      socket.getInfo(stateContinuation);
      expect(sendContinuation).toHaveBeenCalled();
      done();
    }, 500);
    sendingSocket.destroy(destroyContinuation);
    socket.destroy(destroyContinuation);
    setTimeout(function() {
      socket.getInfo(stateContinuation);
      expect(destroyContinuation.calls.count()).toEqual(2);
      done();
    }, 500);
  });

  function str2ab(str) {
    var buf = new ArrayBuffer(str.length);
    var bufView = new Uint8Array(buf);
    for (var i=0, strLen=str.length; i<strLen; i++) {
      bufView[i] = str.charCodeAt(i);
    }
    return buf;
  }
};
