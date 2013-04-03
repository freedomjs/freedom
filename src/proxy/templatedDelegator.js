fdom.Proxy.templatedDelegator = function(channel, definition) {
  var provider = null;
  var instances = {};
  var synchronous = true;

  var events = {};
  eachProp(definition, function(prop, name) {
    if (prop['type'] == 'event') {
      events[name] = prop;
    }
  });

  this['provideSynchronous'] = function(pro) {
    provider = pro;
  }

  this['provideAsynchronous'] = function(pro) {
    provider = pro;
    synchronous = false;
  }
  
  function buildInstance(identifier) {
    var instance = new provider();
    instance['dispatchEvent'] = function(id, name, value) {
      if (events[name]) {
        channel.postMessage({
          'action': 'event',
          flowId: id,
          'type': name,
          'value': conform(events[name].value, value)
        })
      }
    }.bind({}, identifier);
    return instance;
  }

  channel['on']('message', function(msg) {
    if (!msg) return;
    if (!instances[msg.flowId]) {
      if (msg.action == 'construct') {
        instances[msg.flowId] = buildInstance(msg.flowId);
      }
      return;
    }

    if (msg.action == 'method') {
      var instance = instances[msg.flowId];
      if (synchronous) {
        var ret = instance[msg.type].apply(instance, msg.value);
        channel.postMessage({
          'action': 'method',
          flowId: msg.flowId,
          reqId: msg.reqId,
          'type': msg.type,
          'value': ret
        });
      } else {
        var args = msg.value;
        if (!Array.isArray(args)) {
          args = [args];
        }
        instance[msg.type].apply(instance, args.concat(function(ret) {
          channel.postMessage({
            'action': 'method',
            'type': msg.type,
            flowId: msg.flowId,
            reqId: msg.reqId,
            'value': ret
          });
        }));
      }
    }
  });
};

