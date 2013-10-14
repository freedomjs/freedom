/*globals fdom:true, handleEvents, mixin, eachProp, makeAbsolute */
/*jslint indent:2,white:true,sloppy:true */

/**
 * Core freedom services available to all modules.
 * Created by a local manager in response to a 'core' request.
 * @Class Core_unprivileged
 * @constructor
 * @param {Port.Manager} manager The manager this core is connected with.
 * @private
 */
var Core_unprivileged = function(manager) {
  this.manager = manager;
};

Core_unprivileged.unboundChannels = {};

/**
 * Create a custom channel.
 * Returns the structure {channel: fdom.proxy.Deferred, identifier: Object},
 * where the identifier can be 'redeemed' by another module or provider using
 * bind channel, at which point the deferred object will resolve with a channel
 * between the two endpoints.
 * @method createChannel
 * @params {Function} continuation Method to call with the cosntructed structure.
 */
Core_unprivileged.prototype.createChannel = function(continuation) {
  var proxy = new fdom.port.Proxy(fdom.proxy.EventInterface),
      deferred = fdom.proxy.Deferred(),
      id = getId();
  this.manager.setup(proxy);

  if (this.manager.delegate && this.manager.toDelegate['core']) {
    this.manager.emit(this.manager.delegate, {
      type: 'Delegation',
      request: 'handle',
      flow: 'core',
      message: {
        type: 'register',
        id: id
      }
    });
  }
  Core_unprivileged.unboundChannels[id] = {
    local: true,
    proxy: proxy
  };

  proxy.once('start', function(deferred, proxy) {
    deferred.resolve(proxy.getInterface());
  }.bind(this, deferred, proxy));

  continuation({
    channel: deferred,
    identifier: id
  });
};

Core_unprivileged.prototype.onMessage = function(source, msg) {
  if (msg.type == 'register') {
    Core_unprivileged.unboundChannels[msg.id] = {
      remote: true,
      resolve: msg.reply,
      source: source
    };
  } else if (msg.type == 'clear') {
    delete Core_unprivileged.unboundChannels[msg.id];
  } else if (msg.type == 'bind') {
    if (Core_unprivileged.unboundChannels[msg.id]) {
      this.bindChannel(msg.id, function() {}, source);
    }
  }
};

/**
 * Bind a custom channel.
 * Creates a proxy interface to the custom channel, which will be bound to
 * the proxy obtained through an earlier createChannel call.
 * channel to a proxy.
 * @method bindChannel
 * @param {Object} identifier An identifier obtained through createChannel.
 * @param {Function} continuation A function to be called with the proxy.
 */
Core_unprivileged.prototype.bindChannel = function(identifier, continuation, source) {
  var toBind = Core_unprivileged.unboundChannels[identifier],
      newSource = !source;

  if (newSource) {
    console.log('making local proxy for core binding');
    source = new fdom.port.Proxy(fdom.proxy.EventInterface);
    this.manager.setup(source);
  }

  if (toBind && toBind.local) {
    console.log('doing local binding with ' + source);
    this.manager.createLink(source, identifier, toBind.proxy, 'default'); //, toBind.proxy);
    delete Core_unprivileged.unboundChannels[identifier];
    if (this.manager.delegate && this.manager.toDelegate['core']) {
      this.manager.emit(this.manager.delegate, {
        type: 'Delegation',
        request: 'handle',
        flow: 'core',
        message: {
          type: 'clear',
          id: identifier
        }
      });
    }
  } else if (toBind && toBind.remote) {
    console.log('doing remote binding downward');
    this.manager.createLink(source, newSource ? 'default' : identifier, toBind.source, identifier);
    toBind.resolve({
      type: 'Bind Channel',
      request:'core',
      flow: 'core',
      message: {
        type: 'bind',
        id: identifier
      }
    });
    delete Core_unprivileged.unboundChannels[identifier];
  } else if (this.manager.delegate && this.manager.toDelegate['core']) {
    console.log('doing remote binding upwards');
    console.warn('delegating bind request, since i havent seen ' + identifier, Core_unprivileged.unboundChannels);
    this.manager.emit(this.manager.delegate, {
      type: 'Delegation',
      request: 'handle',
      flow: 'core',
      message: {
        type: 'bind',
        id: identifier
      }
    });
    source.once('start', function(p, cb) {
      cb(p.getInterface());
    }.bind(this, source, continuation));
    this.manager.createLink(source, 'default', this.manager.hub.getDestination(this.manager.delegate), identifier);
    delete Core_unprivileged.unboundChannels[identifier];
    return;
  } else {
    console.warn('Asked to bind unknown channel: ' + identifier);
    console.log(Core_unprivileged.unboundChannels);
    continuation();
    return;
  }

  if (source.getInterface) {
    continuation(source.getInterface());
  } else {
    continuation();
  }
};

fdom.apis.register("core", Core_unprivileged);
