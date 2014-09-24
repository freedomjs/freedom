describe("integration-single: social.loopback.json",
    require('./social.single.integration.src').bind(this, "/providers/social/loopback/social.loopback.json"));
describe("integration-single: social.ws.json",
    require('./social.single.integration.src').bind(this, "/providers/social/websocket-server/social.ws.json"));
describe("integration-double: social.ws.json",
    require('./social.double.integration.src').bind(this, "/providers/social/websocket-server/social.ws.json"));
