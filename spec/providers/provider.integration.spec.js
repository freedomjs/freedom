var testUtil = require("../util");
var setup = function() {
  testUtil.setCoreProviders([
    require("../../providers/core/core.unprivileged"),
    require("../../providers/core/console.unprivileged"),
    require("../../providers/core/peerconnection.unprivileged"),
    require("../../providers/core/storage.localstorage"),
    require("../../providers/core/websocket.unprivileged")
  ]);
};
describe("integration-single: social.loopback.json",
    require("./social/social.single.integration.src").bind(this, "/providers/social/loopback/social.loopback.json", setup));
describe("integration-single: social.ws.json",
    require("./social/social.single.integration.src").bind(this, "/providers/social/websocket-server/social.ws.json", setup));
describe("integration-double: social.ws.json",
    require("./social/social.double.integration.src").bind(this, "/providers/social/websocket-server/social.ws.json", setup));

describe("integration: storage.isolated.json",
    require("./storage/storage.integration.src").bind(this, "/providers/storage/isolated/storage.isolated.json", setup));
describe("integration: storage.shared.json",
    require("./storage/storage.integration.src").bind(this, "/providers/storage/shared/storage.shared.json", setup, false));
describe("integration: storage.indexeddb.json",
    require("./storage/storage.integration.src").bind(this, "/providers/storage/indexeddb/storage.indexeddb.json", setup));
describe("integration: storebuffer.indexeddb.json",
    require("./storage/storage.integration.src").bind(this, "/providers/storage/indexeddb/storebuffer.indexeddb.json", setup, true));

describe("integration: transport.webrtc.json",
    require("./transport/transport.integration.src").bind(this, "/providers/transport/webrtc/transport.webrtc.json", setup));

// core.rtcpeerconnection
describe("integration: core.rtcpeerconnection",
    require("./coreIntegration/rtcpeerconnection.integration.src").bind(this,
    require("../../providers/core/core.rtcpeerconnection"),
    require("../../providers/core/core.rtcdatachannel"), setup));

// core.oauth
describe("integration: core.oauth",
    require("./coreIntegration/oauth.integration.src").bind(this,
    require("../../providers/core/core.oauth"), 
    [
      require("../../providers/oauth/oauth.localpageauth"),
      require("../../providers/oauth/oauth.remotepageauth"),
    ],
    setup));
