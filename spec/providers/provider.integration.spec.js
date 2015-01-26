var testUtil = require("../util");
var setup = function() {
  testUtil.setCoreProviders([
    require("../../providers/core/core.unprivileged"),
    require("../../providers/core/core.console"),
    require("../../providers/core/core.peerconnection"),
    require("../../providers/core/core.storage"),
    require("../../providers/core/core.websocket")
  ]);
};

ddescribe("integration-single: social.loopback.json", require("./social/social.single.integration.src")
  .bind(this, window.freedom, "providers/social/loopback/social.loopback.json"), {});
describe("integration-single: social.ws.json", require("./social/social.single.integration.src")
  .bind(this, window.freedom, "providers/social/websocket-server/social.ws.json", {}));
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

describe("integration: Module Environment",
    require("./coreIntegration/environment.integration.src").bind(this, setup));


// core.rtcpeerconnection
describe("integration: core.rtcpeerconnection",
    require("./coreIntegration/rtcpeerconnection.integration.src").bind(this,
    require("../../providers/core/core.rtcpeerconnection"),
    require("../../providers/core/core.rtcdatachannel"), setup));

// core.xhr
describe("integration: core.xhr", 
    require("./coreIntegration/xhr.integration.src").bind(this, 
    require("../../providers/core/core.xhr"), setup));

// core.oauth
describe("integration: core.oauth - localpageauth",
    require("./coreIntegration/oauth.integration.src").bind(this,
    require("../../providers/core/core.oauth"), 
    [ require("../../providers/oauth/oauth.localpageauth") ],
    [ "http://localhost:9876/", "http://localhost:9876/debug.html", "http://localhost:9876/context.html" ],
    setup));
describe("integration: core.oauth - remotepageauth",
    require("./coreIntegration/oauth.integration.src").bind(this,
    require("../../providers/core/core.oauth"),
    [ require("../../providers/oauth/oauth.remotepageauth") ],
    [ "https://willscott.github.io/freedom-oauth-relay/oauth-relay.html" ],
    setup));
