var SOCIAL_SINGLE_INTEGRATION_SPEC = function(provider_name) {
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

  function makeClientState(status) {
    return {
      userId: jasmine.any(String),
      clientId: jasmine.any(String),
      status: fdom.apis.get("social").definition.STATUS.value[status],
      timestamp: jasmine.any(Number)
    };
  }
  
  it("logs in", function() {
    var ids = {};
    var callbackOne = function(ret) {
      expect(ret).toEqual(makeOnStatus("ONLINE"));
    
      ids[1] = helper.call("s", "logout", [], function(ret) {
        done();
      });
    };
    
    ids[0] = helper.call("s", "login", [{agent: "jasmine", interactive: false}], callbackOne);
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

describe("integration-single: social.loopback.json", SOCIAL_SINGLE_INTEGRATION_SPEC.bind(this, "social.loopback"));
describe("integration-single: social.ws.json", SOCIAL_SINGLE_INTEGRATION_SPEC.bind(this, "social.ws"));
