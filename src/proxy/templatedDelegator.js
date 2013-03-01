fdom.Proxy.templatedDelegator = function(channel, definition) {
  var provider = null;
  var synchronous = true;

  var events = {};
  eachProp(definition, function(prop, name) {
    if (prop['type'] == 'event') {
      events[name] = prop;
    }
  });
  if (events !== {}) {
    this['emit'] = function(name, value) {
      if (events[name]) {
        channel.postMessage({
          'action': 'event',
          'type': name,
          'value': conform(events[name].value, value)
        });
      }
    }
  }


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
          'id': msg.id,
          'type': msg.type,
          'value': ret
        });
      } else {
        var args = msg.value;
        if (!Array.isArray(args)) {
          args = [args];
        }
        provider[msg.type].apply(provider, args.concat(function(ret) {
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

