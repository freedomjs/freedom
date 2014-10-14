var testUtil = require('../util');
var setup = function() {
  testUtil.setCoreProviders([
    require('../../providers/core/core.unprivileged'),
    require('../../providers/core/logger.console'),
    require('../../providers/core/peerconnection.unprivileged'),
    require('../../providers/core/storage.localstorage'),
    require('../../providers/core/websocket.unprivileged')
  ]);
};

describe("integration-single: social.loopback.json",
    require('./social/social.single.integration.src').bind(this, "/providers/social/loopback/social.loopback.json", setup));
describe("integration-single: social.ws.json",
    require('./social/social.single.integration.src').bind(this, "/providers/social/websocket-server/social.ws.json", setup));
describe("integration-double: social.ws.json",
    require('./social/social.double.integration.src').bind(this, "/providers/social/websocket-server/social.ws.json", setup));

describe("integration: storage.isolated.json",
    require('./storage/storage.integration.src').bind(this, "/providers/storage/isolated/storage.isolated.json", setup));
describe("integration: storage.shared.json",
    require('./storage/storage.integration.src').bind(this, "/providers/storage/shared/storage.shared.json", setup, false));
describe("integration: storage.indexeddb.json",
    require('./storage/storage.integration.src').bind(this, "/providers/storage/indexeddb/storage.indexeddb.json", setup));
describe("integration: storebuffer.indexeddb.json",
    require('./storage/storage.integration.src').bind(this, "/providers/storage/indexeddb/storebuffer.indexeddb.json", setup, true));

describe("integration: transport.webrtc.json",
    require('./transport/transport.integration.src').bind(this, "/providers/transport/webrtc/transport.webrtc.json", setup));
