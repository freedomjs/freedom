var WS = require('../../../providers/core/websocket.unprivileged');

function MockWebSocket(url, protocols) {
  MockWebSocket.currentInstance = this;

  this._name = Math.random();
  this.url = url;
  this.protocols = protocols;
  // this.readyState = MockWebSocket.readyStates["CONNECTING"];

  this.readyState = MockWebSocket.readyStates["CONNECTING"];
  setTimeout(this._open.bind(this), 0);

  // Record of dispatched events.
  this.dispatchedEvents = {};
}

MockWebSocket.readyStates = {
  "CONNECTING" : 0,
  "OPEN" : 1,
  "CLOSING" : 2,
  "CLOSED" : 3
};

MockWebSocket.prototype.dispatchEvent = function(event, data) {
  this.dispatchedEvents[event] = data;
  if (this.hasOwnProperty(event)) {
    this[event](data);
  }
};

MockWebSocket.prototype._open = function() {
  this.readyState = MockWebSocket.readyStates["OPEN"];
  this.dispatchEvent("onopen");
};

MockWebSocket.prototype.send = function(data) {
  this.sent = data;
};

MockWebSocket.prototype.close = function(code, reason) {
  this.readyState = MockWebSocket.readyStates["CLOSED"];
  this.dispatchEvent("onclose", {});
};

describe("core.websocket unprivileged", function() {
  var websocket;
  var WS_URL = "ws://p2pbr.com:8082/route/";
  var eventManager;

  function EventManager() {
    this.active = true;
    this.listeners = {};
    this.dispatchedEvents = {};
  }

  EventManager.prototype.dispatchEvent = function(event, data) {
    if (!this.active) {
      return;
    }
    this.dispatchedEvents[event] = data;
    if (this.listeners[event]) {
      this.listeners[event](data);
    }
  };

  EventManager.prototype.listenFor = function(event, listener) {
    this.listeners[event] = listener;
  };

  beforeEach(function() {
    eventManager = new EventManager();
    var dispatchEvent = eventManager.dispatchEvent.bind(eventManager);
    websocket = new WS.provider(undefined,dispatchEvent,
                       WS_URL, undefined,
                       MockWebSocket);
    spyOn(MockWebSocket.currentInstance, "send").and.callThrough();
    spyOn(MockWebSocket.currentInstance, "close").and.callThrough();
  });

  afterEach(function() {
    eventManager.active = false;
    eventManager = undefined;
    delete MockWebSocket.currentInstance;
    websocket = undefined;
  });

  it("fires onopen", function(done) {
    function onOpen() {
      done();
    }
    eventManager.listenFor("onOpen", onOpen);
  });

  it("closes", function(done) {

    function closeContinuation(noop, exception) {
      expect(noop).not.toBeDefined();
      expect(exception).not.toBeDefined();

      var mock = MockWebSocket.currentInstance;
      expect(mock.close.calls.count()).toEqual(1);
      done();
    }

    websocket.close(undefined, undefined, closeContinuation);
  });

  it("sends", function(done) {
    // We only test strings because phantomjs doesn't support Blobs or
    // ArrayBuffers. :(
    var message = {
      text: "Hello World"
    };
    function sendContinuation() {
      var mock = MockWebSocket.currentInstance;
      expect(mock.send.calls.count()).toEqual(1);
      expect(mock.sent).toEqual("Hello World");
      done();
    }
    websocket.send(message, sendContinuation);
  });

  it("send gives error with bad data", function(done) {
    var message = {
    };
    function sendContinuation(noop, error) {
      expect(error).toBeDefined();
      expect(error.errcode).toEqual("BAD_SEND");
      done();
    }
    websocket.send(message, sendContinuation);
  });

  it("gets ready state", function(done) {
    var mock = MockWebSocket.currentInstance;

    function readyStateContinuation(state) {
      expect(mock.readyState).toEqual(MockWebSocket.readyStates["OPEN"]);
      expect(state).toEqual(MockWebSocket.readyStates["OPEN"]);
      done();
    }
    function onOpen() {
      expect(mock.readyState).toEqual(MockWebSocket.readyStates["OPEN"]);
      websocket.getReadyState(readyStateContinuation);  
    }
    
    eventManager.listenFor("onOpen", onOpen);
  });
  
  it("receives messages", function(done) {
    eventManager.listenFor('onMessage', function(m) {
      expect(m).toEqual({text: 'mytext'});
      done();
    });
    MockWebSocket.currentInstance.onmessage({data: 'mytext'});
  });
});
