var listeningFor = {};
var providers = {"core": freedom.core()};
var channels = {};

var base = freedom();

// action = {
//  name: name to store provider under in "providers" object, 
//  provider: name in manifest
// }
base.on("create", function(action) {
  var name = action.name;
  var provider = action.provider;
  var constructorArguments = action.constructorArguments || [];
  providers[name] = freedom[provider].apply(freedom[provider],
                                            constructorArguments);
  listeningFor[action.name] = {};
});

// action = {
//  id: unique ID of call (tied to result), 
//  name: name of provider in "providers" object, 
//  method: method to call, 
//  args: array of arguments to method}
base.on("call", function(action){
  var p = providers[action.provider];
	var promise = p[action.method].apply(null, action.args);
  promise.then(function(ret) {
    base.emit("return", {
      id: action.id,
      data: ret
    });
	}, function(err) {
    base.emit("error", {
      id: action.id,
      data: err
    });
  });
});

base.on('listenForEvent', function(listenEventInfo) {
  var providerName = listenEventInfo.provider;
  var eventName = listenEventInfo.event;
  var provider = providers[providerName];

  if (!listeningFor[providerName][eventName]) {
    provider.on(listenEventInfo.event, function (eventPayload) { 
      base.emit('eventFired', {provider: providerName,
                                  event: eventName,
                                  eventPayload: eventPayload});
    });
    listeningFor[providerName][eventName] = true;
  }
});

base.on("createChannel", function() {
  //providers.core.createChannel().done(function(chan) {
  freedom.core().createChannel().then(function(chan) {
    channels[chan.identifier] = chan.channel;
    chan.channel.on("message", function(msg){
      base.emit("inFromChannel", {
        chanId: chan.identifier,
        message: msg
      });
    });
    base.emit("initChannel", chan.identifier);
  });
});

// action = {
//  chanId: channel identifier,
//  message: message to send
// }
base.on("outToChannel", function(action) {
  channels[action.chanId].emit("message", action.message);
});
