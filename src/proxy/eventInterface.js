/*globals fdom:true, handleEvents */
/*jslint indent:2, white:true, node:true, sloppy:true, browser:true */
if (typeof fdom === 'undefined') {
  fdom = {};
}
fdom.proxy = fdom.proxy || {};

fdom.proxy.EventInterface = function(onMsg, emit) {
  handleEvents(this);
  
  onMsg(this.emit.bind(this));

  this.emit = function(emitter, type, msg) {
    emitter({type: type, message: msg});
  }.bind({}, emit);
};
