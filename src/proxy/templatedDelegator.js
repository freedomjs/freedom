fdom.Proxy.templatedDelegator = function(channel, definition) {
  var provider = null;
  
  this['provideSynchronous'] = function(pro) {
    // TODO(willscott): support 1-1 mapping of provider to proxies.
    provider = new pro();
  }

  channel['on']('message', function(msg) {
    if (!msg) return;
    if (msg.action == 'method') {
      var ret = provider[msg.type].apply(provider, msg.value);
      channel.postMessage({
        'action': 'method',
        'type': msg.type,
        'value': ret
      });
    }
  });
};

