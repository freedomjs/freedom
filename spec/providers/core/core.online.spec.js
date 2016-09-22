var CoreOnline = require('../../../providers/core/core.online');

describe("core.online", function() {
  var listeners = {};
  var listenerCount = 0;
  var onListenersReady = null;
  var mockNav = { onLine: false };
  var mockWin = {
    ononline: null,
    onoffline: null,
    addEventListener: function(name, listener) {
      listeners[name] = listener;
      ++listenerCount;
      if (listenerCount === 2 && onListenersReady) {
        Promise.resolve().then(onListenersReady);
      }
    }
  };

  var discardEvent = function(eventName, event) {};

  beforeEach(function() {
    CoreOnline.setMocks(mockNav, mockWin);
    listenerCount = 0;
    onListenersReady = null;
  });

  it("isOnline false", function(done) {
    expect(mockNav.onLine).toEqual(false);
    var online = new CoreOnline.provider(undefined, discardEvent);
    online.isOnline().then(function(online) {
      expect(online).toEqual(mockNav.onLine);
      done();
    });
  });

  it("isOnline true", function(done) {
    CoreOnline.setMocks({ onLine: true }, mockWin);
    var online = new CoreOnline.provider(undefined, discardEvent);
    online.isOnline().then(function(online) {
      expect(online).toEqual(true);
      done();
    });
  });

  it("No support fallback", function(done) {
    CoreOnline.setMocks({}, mockWin);
    var online = new CoreOnline.provider(undefined, discardEvent);
    online.isOnline().then(function(online) {
      expect(online).toEqual(true);
      done();
    });
  });

  it("Empty environment fallback", function(done) {
    CoreOnline.setMocks(undefined, undefined);
    var online = new CoreOnline.provider(undefined, discardEvent);
    online.isOnline().then(function(online) {
      expect(online).toEqual(true);
      done();
    });
  });

  var eventTest = function(name, done) {
    var mockEvent = new Event(name);
    var dispatchEvent = function(eventName, event) {
      expect(eventName).toEqual(name);
      expect(event).toEqual(mockEvent);
      done();
    };
    onListenersReady = function() {
      listeners[name](mockEvent);
    };
    var dummy = new CoreOnline.provider(undefined, dispatchEvent);
  };

  it("online", eventTest.bind(this, 'online'));
  it("offline", eventTest.bind(this, 'offline'));
});
