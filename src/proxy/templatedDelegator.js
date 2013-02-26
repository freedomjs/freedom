fdom.Proxy.templatedDelegator = function(channel, definition) {
  var provider = null;
  var synchronous = true;
  
  this['provideSynchronous'] = function(pro) {
    // TODO(willscott): support 1-1 mapping of provider to proxies.
    provider = new pro();
  }

  this['provideAsynchronous'] = function(pro) {
    provider = new pro();
    synchronous = false;
  }

  channel['on']('message', function(msg) {
    if (!msg) return;
    if (msg.action == 'method') {
      if (synchronous) {
        var ret = provider[msg.type].apply(provider, msg.value);
        channel.postMessage({
          'action': 'method',
          'type': msg.type,
          'value': ret
        });
      } else {
        provider[msg.type].apply(provider, msg.value.concat(function(ret) {
          channel.postMessage({
            'action': 'method',
            'type': msg.type,
            'value': ret
          });
        }));
      }
    }
  });
};

