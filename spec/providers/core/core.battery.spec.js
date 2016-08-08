var CoreBattery = require('../../../providers/core/core.battery');

describe("core.battery", function() {
  var listeners = {};
  var listenerCount = 0;
  var onListenersReady = null;
  var mockBattery = {
    charging: false,
    chargingTime: 5,
    dischargingTime: -Infinity,
    level: 0.5,
    addEventListener: function(name, listener) {
      listeners[name] = listener;
      ++listenerCount;
      if (listenerCount === 4 && onListenersReady) {
        Promise.resolve().then(onListenersReady);
      }
    }
  };

  var mockNavigator = {
    getBattery: function() {
      return Promise.resolve(mockBattery);
    }
  };

  var discardEvent = function(eventName, event) {};

  beforeEach(function() {
    listenerCount = 0;
    onListenersReady = null;
  });

  afterEach(function() {
  });

  it("getCharging", function(done) {
    CoreBattery.setNavigator(mockNavigator);
    var bat = new CoreBattery.provider(undefined, discardEvent);
    bat.getCharging().then(function(charging) {
      expect(charging).toEqual(mockBattery.charging);
      done();
    });
  });

  it("getCharging fallback", function(done) {
    CoreBattery.setNavigator({});
    var bat = new CoreBattery.provider(undefined, discardEvent);
    bat.getCharging().then(function(charging) {
      expect(charging).toEqual(true);
      done();
    });
  });

  it("getChargingTime", function(done) {
    CoreBattery.setNavigator(mockNavigator);
    var bat = new CoreBattery.provider(undefined, discardEvent);
    bat.getChargingTime().then(function(chargingTime) {
      expect(chargingTime).toEqual(mockBattery.chargingTime);
      done();
    });
  });

  it("getChargingTime fallback", function(done) {
    CoreBattery.setNavigator({});
    var bat = new CoreBattery.provider(undefined, discardEvent);
    bat.getChargingTime().then(function(chargingTime) {
      expect(chargingTime).toEqual(0);
      done();
    });
  });

  it("getDischargingTime", function(done) {
    CoreBattery.setNavigator(mockNavigator);
    var bat = new CoreBattery.provider(undefined, discardEvent);
    bat.getDischargingTime().then(function(dischargingTime) {
      expect(dischargingTime).toEqual(mockBattery.dischargingTime);
      done();
    });
  });

  it("getDischargingTime fallback", function(done) {
    CoreBattery.setNavigator({});
    var bat = new CoreBattery.provider(undefined, discardEvent);
    bat.getDischargingTime().then(function(dischargingTime) {
      expect(dischargingTime).toEqual(Infinity);
      done();
    });
  });

  it("getLevel", function(done) {
    CoreBattery.setNavigator(mockNavigator);
    var bat = new CoreBattery.provider(undefined, discardEvent);
    bat.getLevel().then(function(level) {
      expect(level).toEqual(mockBattery.level);
      done();
    });
  });

  it("getLevel fallback", function(done) {
    CoreBattery.setNavigator({});
    var bat = new CoreBattery.provider(undefined, discardEvent);
    bat.getLevel().then(function(level) {
      expect(level).toEqual(1.0);
      done();
    });
  });

  var eventTest = function(name, done) {
    var mockEvent = new Event(name);
    mockEvent.charging = true;
    var dispatchEvent = function(eventName, event) {
      expect(eventName).toEqual(name);
      expect(event).toEqual(mockEvent);
      done();
    };
    CoreBattery.setNavigator(mockNavigator);
    onListenersReady = function() {
      listeners[name](mockEvent);
    };
    var bat = new CoreBattery.provider(undefined, dispatchEvent);
  };

  it("chargingchange", eventTest.bind(this, 'chargingchange'));
  it("chargingtimechange", eventTest.bind(this, 'chargingtimechange'));
  it("dischargingtimechange", eventTest.bind(this, 'dischargingtimechange'));
  it("levelchange", eventTest.bind(this, 'levelchange'));
});
