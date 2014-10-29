var testUtil = require('../../util');

module.exports = function(provider, setup) {
  var socket, serverDispatchEvent;
  const listenPort = 8082, sendPort = 8083;
  beforeEach(function () {
    setup();
    serverDispatchEvent = jasmine.createSpy("dispatchEvent");
    socket = new provider.provider(undefined, serverDispatchEvent);
  });

  it('does stuff', function (done) {
    // Currently a copy of 'receives data' unit test from firefox, change it
    const sendString = "Hello World",
          sendBuffer = str2ab(sendString),
          clientDispatchEvent = jasmine.createSpy("dispatchEvent"),
          sendingSocket = new provider.provider(undefined, clientDispatchEvent),
          sendContinuation = jasmine.createSpy("sendContinuation"),
          bindContinuation = jasmine.createSpy("bindContinuation"),
          destroyContinuation1 = jasmine.createSpy("destroyContinuation"),
          destroyContinuation2 = jasmine.createSpy("destroyContinuation");
    // Set up connections
    socket.bind("localhost", listenPort, bindContinuation);
    expect(bindContinuation).toHaveBeenCalledWith(0);
    sendingSocket.bind("localhost", sendPort, bindContinuation);
    expect(bindContinuation.calls.count()).toEqual(2);
    expect(bindContinuation.calls.mostRecent().args[0]).toEqual(0);

    // Check socket state
    const listenState = {"localAddress": "localhost", "localPort": listenPort},
          sendState = {"localAddress": "localhost", "localPort": sendPort};
    var stateSpy = jasmine.createSpy("state");
    socket.getInfo(stateSpy);
    expect(stateSpy).toHaveBeenCalledWith(listenState);
    sendingSocket.getInfo(stateSpy);
    expect(stateSpy).toHaveBeenCalledWith(sendState);
    expect(stateSpy.calls.count()).toEqual(2);

    // Check data sending
    serverDispatchEvent.and.callFake(function fakeDispatchEvent(event, data) {
      expect(event).toEqual("onData");
      expect(data.resultCode).toEqual(0);
      expect(data.port).toEqual(sendPort);
      expect(data.data).toEqual(sendBuffer);
      done();
    });
    sendingSocket.sendTo(sendBuffer, "localhost",
                         listenPort, sendContinuation);
    expect(sendContinuation).toHaveBeenCalled();

    sendingSocket.destroy(destroyContinuation1);
    socket.destroy(destroyContinuation2);
    expect(destroyContinuation1).toHaveBeenCalled();
    expect(destroyContinuation2).toHaveBeenCalled();
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
