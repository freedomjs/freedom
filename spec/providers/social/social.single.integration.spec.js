var SOCIAL_SINGLE_INTEGRATION_SPEC = function(provider_name, network_id) {
  const TIMEOUT = 2000;
  var freedom, helper;

  beforeEach(function() {
    freedom = setupModule("relative://spec/helper/providers.json");
    helper = new ProviderHelper(freedom);
    helper.create("s", provider_name);
  });
  
  afterEach(function() {
    helper.removeListeners("s");
    cleanupIframes();
  });

  function makeOnStatus(status) {
    return {
      network: network_id,
      userId: jasmine.any(String),
      clientId: jasmine.any(String),
      status: fdom.apis.get("social").definition.STATUS_NETWORK.value[status],
      message: jasmine.any(String)
    };
  }
  
  xit("logs in", function() {
    var ids = {};
    
    runs(function() {
      ids[0] = helper.call("SocialA", "login", [{network: network_id, agent: "jasmine", interactive: false}]);
    });
    waitsFor("logs in", helper.hasReturned.bind(helper, ids), TIMEOUT);

    runs(function() {
      expect(helper.returns[ids[0]]).toBeDefined();
      expect(helper.returns[ids[0]]).toEqual(makeOnStatus("ONLINE"));
      ids[1] = helper.call("SocialA", "logout", [{}]);
    });
  });

  xit("logs in, then out (x5)", function() {
  
  });

  xit("logs in twice", function() {
  
  });

  xit("logs out when already logged out", function() {
  
  });

  xit("returns roster", function() {
  
  });

  xit("sends message", function() {
  
  });
 
};

describe("integration-single: social.loopback.json", SOCIAL_SINGLE_INTEGRATION_SPEC.bind(this, "social.loopback", "loopback"));
describe("integration-single: social.ws.json", SOCIAL_SINGLE_INTEGRATION_SPEC.bind(this, "social.ws", "websockets"));
