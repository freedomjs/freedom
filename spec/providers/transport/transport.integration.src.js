var testUtil = require('../../util');
var util = require('../../../src/util');

module.exports = function(provider_url, setup) { 
  var helper, signals;

  beforeEach(function(done) {
    setup();
    signals = [];
    testUtil.providerFor(provider_url, "transport").then(function(h) {
      helper = h;
      done();
    });
  });

  afterEach(function() {
    testUtil.cleanupIframes();
  });

  function createTwoProviders(callback) {
    var channels = {chanId1: undefined,
                    chanId2: undefined};

    helper.create("t1");
    helper.create("t2");

    helper.createChannel(createChannelCallback.bind(undefined, "chanId1"));
    helper.createChannel(createChannelCallback.bind(undefined, "chanId2"));

    function createChannelCallback(channelName, newChannelId) {
      channels[channelName] = newChannelId;
      if (channels.chanId1 && channels.chanId2) {
        helper.setChannelCallback(channels.chanId1, function(msg) {
          signals.push(msg);
          helper.sendToChannel(channels.chanId2, msg);
        });
        helper.setChannelCallback(channels.chanId2, function(msg) {
          signals.push(msg);
          helper.sendToChannel(channels.chanId1, msg);
        });
        callback(channels.chanId1, channels.chanId2);
      }
    }
  }
  
  it("generates signals", function(done) {
    var ids = {};
    var chanId = undefined;
    helper.create("t");
    helper.createChannel(function(newChanId) {
      chanId = newChanId;
      helper.setChannelCallback(chanId, function(msg) {
        signals.push(msg);
        expect(signals.length).toBeGreaterThan(0);
        done();
      });
      var sendData = util.str2ab("HI");
      ids[0] = helper.call('t', "setup", ["t", chanId]);
      ids[1] = helper.call('t', "send", ["tag", sendData]);
    });
  });

  it("sends a small amount of data.", function(done) {
    var testString = "Hi";
    var ids = {};
    function doSend (chanId1, chanId2) {
      helper.on("t2", "onData", function(result) {
        var resultStr = util.ab2str(result.data);
        expect(signals.length).toBeGreaterThan(0);
        //@todo This returns false on Firefox 30
        //expect(result.data instanceof ArrayBuffer).toBe(true);
        expect(result.data.byteLength).toEqual(4);
        expect(result.tag).toEqual("tag");
        expect(resultStr).toEqual(testString);
        done();
      });

      var sendData = util.str2ab(testString);
      ids[0] = helper.call("t1", "setup", ["t1", chanId1]);
      ids[1] = helper.call("t2", "setup", ["t2", chanId2]);
      ids[2] = helper.call("t1", "send", ["tag", sendData]);
    };

    createTwoProviders(doSend);
  });

  it("chunks data", function(done) {
    var testString = "1234567890ABC";
    var ids = {};

    for (var i = 0; i < 8; i++) {
      testString += testString + testString;
    }
    // This assumes testString.length is greater than the chunk
    // size. If you change the chunk size, modify this test.

    function doSend (chanId1, chanId2) {
      helper.on("t2", "onData", function(result) {
        var resultStr = util.ab2str(result.data);
        expect(signals.length).toBeGreaterThan(0);
        //@todo This returns false on Firefox 30
        //expect(result.data instanceof ArrayBuffer).toBe(true);
        expect(result.data.byteLength).toEqual(170586);
        expect(result.tag).toEqual("tag");
        expect(resultStr).toEqual(testString);
        done();
      });

      var sendData = util.str2ab(testString);
      ids[0] = helper.call("t1", "setup", ["t1", chanId1]);
      ids[1] = helper.call("t2", "setup", ["t2", chanId2]);
      ids[2] = helper.call("t1", "send", ["tag", sendData]);
    };

    createTwoProviders(doSend);
  });

  it("sends through multiple tags", function(done){
    var ids = {};
    var toSend = {"tag1": "This is tag 1",
                  "tag2": "This is tag 2",
                  "tag3": "This is tag 3"};
    var tags = Object.keys(toSend).sort();

    function doSend (chanId1, chanId2) {
      var onDataCount = 0;
      var tagsRecievedOn = [];
      helper.on("t2", "onData", function(result) {
        onDataCount += 1;
        var resultStr = util.ab2str(result.data);
        expect(signals.length).toBeGreaterThan(0);
        //@todo This returns false on Firefox 30
        //expect(result.data instanceof ArrayBuffer).toBe(true);
        expect(result.data.byteLength).toEqual(26);
        expect(resultStr).toEqual(toSend[result.tag]);
        tagsRecievedOn.push(result.tag);
        if (onDataCount === tags.length) {
          tagsRecievedOn.sort();
          expect(tagsRecievedOn).toEqual(tags);
          done();
        }
      });

      var id = 0;
      ids[id++] = helper.call("t1", "setup", ["t1", chanId1]);
      ids[id++] = helper.call("t2", "setup", ["t2", chanId2]);
      for (var tag in toSend) {
        ids[id++] = helper.call("t1", "send", [tag,
                                               util.str2ab(toSend[tag])]);
      }
    };

    createTwoProviders(doSend);
  });

};
