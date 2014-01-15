describe("freedom", function() {
  var freedom, global;
  beforeEach(function() {
    global = {
      addEventListener: function(msg, handler) {
        this['on'+msg] = handler;
      },
      postMessage: function(msg, to) {
        this.lastmsg = msg;
      }
    };
  
    setupResolvers();  
    iac = isAppContext;

    var path = window.location.href,
        dir_idx = path.lastIndexOf('/'),
        dir = path.substr(0, dir_idx) + '/';
    freedom = setup(global, undefined, {
      'isApp': true
    });
  });
  
  it("Loads an App", function() {
    var cb = jasmine.createSpy('cb');
    freedom.emit('fromApp', 'data');
    expect(global.lastmsg).toBeDefined();
  });
});
