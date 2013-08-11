describe("fdom.Channel", function() {
  it("creates pipes to relay messages", function() {
    var pipe = fdom.Channel.pipe();
    var spy = jasmine.createSpy('cb');
    pipe[0].on('message', spy);
    pipe[1].postMessage('testval');
    expect(spy).toHaveBeenCalledWith('testval');
  });

  it("sends messages to an app", function() {
    var app = jasmine.createSpyObj('app', ['postMessage']);
    var channel = new fdom.Channel(app, 'customFlow');
    channel.postMessage('myMessage');
    expect(app.postMessage).toHaveBeenCalledWith({
      sourceFlow: 'customFlow',
      msg: 'myMessage'
    });
  });

  it("emits messages sent to it", function() {
    var channel = new fdom.Channel({}, 'customFlow');
    var spy = jasmine.createSpy('cb');
    channel.on('message', spy);
    channel.onMessage({'type': 'woo'});
    expect(spy).toHaveBeenCalledWith({'type': 'woo'});
    channel.onMessage({'data':'mydata'});
    expect(spy).toHaveBeenCalledWith('mydata');
  });
});

