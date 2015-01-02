module.exports = function(provider, setup) {
  var socket, serverDispatchEvent;
  const listenPort = 8082, sendPort = 8083;
  beforeEach(function () {
    setup();
    serverDispatchEvent = jasmine.createSpy("dispatchEvent");
    socket = new provider.provider(undefined, serverDispatchEvent);
  });

  it("Connects, has state, and sends/receives data", function (done) {
    const todo = [];  // Pending tasks to complete before calling |done()|.
    const markTask = function(name) {
      var tag = { name: name };
      todo.push(tag);
      return tag;
    }
    const did = function(task) {
      var i = todo.indexOf(task);
      expect(i).not.toEqual(-1);  // A task must not be done twice.
      todo.splice(i, 1);  // Remove |task| from the list.
      if (todo.length == 0) {
        done();  // This is the only call to |done()|.
      }
    };
    // callPoint returns a function that must be called exactly once.
    const callPoint = function(name) {
      return did.bind(null, markTask(name));
    };

    const LOCALHOST = '127.0.0.1';
    const checkSocketInfo = function(socketToCheck, port) {
      const getInfoTask = markTask('getInfo');
      socketToCheck.getInfo(function(state) {
        expect(state).toEqual(jasmine.objectContaining({
          'localAddress': LOCALHOST,
          'localPort': port
        }));
        did(getInfoTask);
      });
    };

    const sendString = "Hello World",
          sendBuffer = str2ab(sendString),
          clientDispatchEvent = jasmine.createSpy("dispatchEvent"),
          sendingSocket = new provider.provider(undefined, clientDispatchEvent);

    // Don't finish this test until a packet is received.
    const receivePacketTask = markTask('receive packet');

    // Set up connections
    socket.bind(LOCALHOST, listenPort, function(returnCode) {
      expect(returnCode).toEqual(0);
      checkSocketInfo(socket, listenPort);

      sendingSocket.bind(LOCALHOST, sendPort, function(returnCode) {
        expect(returnCode).toEqual(0);
        checkSocketInfo(sendingSocket, sendPort);

        // Check data sending
        serverDispatchEvent.and.callFake(function(event, data) {
          expect(event).toEqual("onData");
          expect(data.resultCode).toEqual(0);
          expect(data.port).toEqual(sendPort);
          expect(data.data).toEqual(sendBuffer);

          sendingSocket.destroy(callPoint('destroy sending socket'));
          socket.destroy(callPoint('destroy receiving socket'));

          did(receivePacketTask);
        });
        sendingSocket.sendTo(sendBuffer, "127.0.0.1",
                             listenPort, callPoint('send continuation'));
      });
    });
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
