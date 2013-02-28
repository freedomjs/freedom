fdom.Proxy.templatedDelegator = function(channel, definition) {
  var provider = null;
  var synchronous = true;

  var listen = function() {
    eachProp(definition, function(prop, name) {
      if (prop['type'] == 'event') {
        provider['on'](name, function(m) {
          channel.postMessage({
            'action': 'event',
            'type': name,
            'value': m
          })
        });
      }
    });
  }

  this['provideSynchronous'] = function(pro) {
    // TODO(willscott): support 1-1 mapping of provider to proxies.
    provider = new pro();
    listen();
  }

  this['provideAsynchronous'] = function(pro) {
    provider = new pro();
    synchronous = false;
    listen();
  }

  channel['on']('message', function(msg) {
    if (!msg) return;
    if (msg.action == 'method') {
      if (synchronous) {
        var ret = provider[msg.type].apply(provider, msg.value);
        channel.postMessage({
          'action': 'method',
          'id': msg.id,
          'type': msg.type,
          'value': ret
        });
      } else {
        provider[msg.type].apply(provider, msg.value.concat(function(ret) {
          channel.postMessage({
            'action': 'method',
            'type': msg.type,
            'id': msg.id,
            'value': ret
          });
        }));
      }
    }
  });
};

