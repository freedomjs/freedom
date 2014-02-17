describe("Core Provider Integration", function() {
  var freedom_src;

  var freedom;
  beforeEach(function() {
    freedom_src = getFreedomSource();
    
    var global = {
      console: {
        log: function() {}
      },
      document: document
    };
  
    setupResolvers();

    var path = window.location.href,
        dir_idx = path.lastIndexOf('/'),
        dir = path.substr(0, dir_idx) + '/';
    freedom = fdom.setup(global, undefined, {
      manifest: "relative://spec/helper/channel.json",
      portType: 'Frame',
      inject: dir + "node_modules/es5-shim/es5-shim.js",
      src: freedom_src
    });
  });
  
  afterEach(function() {
    var frames = document.getElementsByTagName('iframe');
    for (var i = 0; i < frames.length; i++) {
      frames[i].parentNode.removeChild(frames[i]);
    }
  });

  it("Manages Channels Between Modules", function(done) {
    var cb = jasmine.createSpy('cb');
    freedom.once('message', function(msg) {
      // created.
      expect(msg).toEqual('creating custom channel 0');
      freedom.on('message', cb);
      freedom.on('message', function() {
        expect(cb).toHaveBeenCalledWith('sending message to 0');
        done();
      });
      freedom.emit('message', 0);
    });
    freedom.emit('create');
  });

  it("Manages Channels With providers", function(done) {
    var cb = jasmine.createSpy('cb');
    freedom.once('message', function(msg) {
      // created.
      freedom.on('message', cb);
      freedom.once('message', function() {
        expect(cb).toHaveBeenCalledWith('sending message to peer 0');
        done();
      });
      freedom.emit('message', 0);
    });
    freedom.emit('peer');
  });
});

describe("Core Provider Channels", function() {
  var manager, hub, global, source, core;
  beforeEach(function(done) {
    global = {freedom: {}, document: document};
    hub = new fdom.Hub();
    manager = new fdom.port.Manager(hub);
    hub.emit('config', {
      global: global
    });
    source = createTestPort('test');
    manager.setup(source);

    var chan = source.gotMessage('control').channel;
    hub.onMessage(chan, {
      type: 'Core Provider',
      request: 'core'
    });
    
    setTimeout(function() {
      core = source.gotMessage('control', {type: 'core'}).core;
      done();
    }, 0);
  });

  it('Links Custom Channels', function() {
    expect(core).toBeDefined();

    var c = new core(), id, input;
    var call = c.createChannel(function(chan) {
      id = chan.identifier;
      input = chan.channel;
    });
    expect(input).toBeDefined();
    
    var inHandle = jasmine.createSpy('input');
    input.on(inHandle);
    expect(inHandle).not.toHaveBeenCalled();

    var output;
    c.bindChannel(id, function(chan) {
      output = chan;
    });
    expect(output).toBeDefined();
    
    expect(inHandle).not.toHaveBeenCalled();
    output.emit('message', 'whoo!');
    expect(inHandle).toHaveBeenCalled();
  });


  it('Supports Custom Channel Closing', function() {
    var c = new core(), id, input;
    var call = c.createChannel(function(chan) {
      id = chan.identifier;
      input = chan.channel;
    });
    expect(input).toBeDefined();
    
    var handle = jasmine.createSpy('message');

    var output;
    c.bindChannel(id, function(chan) {
      output = chan;
    });
    expect(output).toBeDefined();
    output.on(handle);

    var closer = jasmine.createSpy('close');
    input.onClose(closer);
    expect(handle).not.toHaveBeenCalled();
    input.emit('message', 'whoo!');
    expect(handle).toHaveBeenCalledWith('message', 'whoo!');
    expect(closer).not.toHaveBeenCalled();
    output.close();
    expect(closer).toHaveBeenCalled();
  });

  it('Manages Module Identifiers', function() {
    var c = new core();
    c.setId(['a','b','c']);
    
    var spy = jasmine.createSpy('id');
    c.getId(spy);
    expect(spy).toHaveBeenCalledWith(['a','b','c']);
  });
});
