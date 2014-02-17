var listeningFor = {};
var providers = {"core": freedom.core()};
var channels = {};

// action = {
//  name: name to store provider under in "providers" object, 
//  provider: name in manifest
// }
freedom.on("create", function(action) {
  providers[action.name] = freedom[action.provider]();
  listeningFor[action.name] = {};
});

// action = {
//  id: unique ID of call (tied to result), 
//  name: name of provider in "providers" object, 
//  method: method to call, 
//  args: array of arguments to method}
freedom.on("call", function(action){
  var p = providers[action.provider];
	var promise = p[action.method].apply(null, action.args);
    promise.then(function(ret) {
      freedom.emit("return", {
        id: action.id,
        data: ret
      });
	});
});

freedom.on('listenForEvent', function(listenEventInfo) {
  var providerName = listenEventInfo.provider;
  var eventName = listenEventInfo.event;
  var provider = providers[providerName];

  if (!listeningFor[providerName][eventName]) {
    provider.on(listenEventInfo.event, function (eventPayload) { 
      freedom.emit('eventFired', {provider: providerName,
                                  event: eventName,
                                  eventPayload: eventPayload});
    });
    listeningFor[providerName][eventName] = true;
  }
});

freedom.on("createChannel", function() {
  //providers.core.createChannel().done(function(chan) {
  freedom.core().createChannel().then(function(chan) {
    channels[chan.identifier] = chan.channel;
    chan.channel.on("message", function(msg){
      freedom.emit("inFromChannel", {
        chanId: chan.identifier,
        message: msg
      });
    });
    freedom.emit("initChannel", chan.identifier);
  });
});

// action = {
//  chanId: channel identifier,
//  message: message to send
// }
freedom.on("outToChannel", function(action) {
  channels[action.chanId].emit("message", action.message);
});
