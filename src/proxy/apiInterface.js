/*globals Promise */
/*jslint indent:2, white:true, node:true, sloppy:true, browser:true */
var debug = require('debug');
var util = require('util');
var Proxy = require('proxy');

var ApiInterface = function(def, onMsg, emit) {
  var inflight = {},
      events = null,
      emitter = null,
      reqId = 0,
      args = arguments;

  util.eachProp(def, function(prop, name) {
    switch(prop.type) {
    case 'method':
      this[name] = function() {
        // Note: inflight should be registered before message is passed
        // in order to prepare for synchronous in-window pipes.
        var thisReq = reqId,
            promise = new Promise(function(resolve, reject) {
              inflight[thisReq] = {
                resolve:resolve,
                reject:reject,
                template: prop.ret
              };
            }),
            streams = Proxy.messageToPortable(prop.value,
                Array.prototype.slice.call(arguments, 0));
        reqId += 1;
        emit({
          action: 'method',
          type: name,
          reqId: thisReq,
          text: streams.text,
          binary: streams.binary
        });
        return promise;
      };
      break;
    case 'event':
      if(!events) {
        util.handleEvents(this);
        emitter = this.emit;
        delete this.emit;
        events = {};
      }
      events[name] = prop;
      break;
    case 'constant':
      Object.defineProperty(this, name, {
        value: Proxy.recursiveFreezeObject(prop.value),
        writable: false
      });
      break;
    }
  }.bind(this));

  onMsg(this, function(type, msg) {
    if (type === 'close') {
      this.off();
      delete this.inflight;
      return;
    }
    if (!msg) {
      return;
    }
    if (msg.type === 'method') {
      if (inflight[msg.reqId]) {
        var resolver = inflight[msg.reqId],
            template = resolver.template;
        delete inflight[msg.reqId];
        if (msg.error) {
          resolver.reject(msg.error);
        } else {
          resolver.resolve(Proxy.portableToMessage(template, msg));
        }
      } else {
        debug.error('Incoming message claimed to be an RPC ' +
                         'returning for unregistered call', msg.reqId);
      }
    } else if (msg.type === 'event') {
      if (events[msg.name]) {
        emitter(msg.name, Proxy.portableToMessage(events[msg.name].value,
                msg));
      }
    }
  }.bind(this));

  args = ApiInterface.messageToPortable(
      (def.constructor && def.constructor.value) ? def.constructor.value : [],
      Array.prototype.slice.call(args, 3));

  emit({
    type: 'construct',
    text: args.text,
    binary: args.binary
  });
};

module.exports = ApiInterface;
