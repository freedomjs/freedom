/*jslint sloppy:true */
/*globals freedom */
/**
 * Chat demo backend.
 * Because the Social API provides message passing primitives,
 * this backend simply forwards messages between the front-end and our Social provider
 * Note that you should be able to plug-and-play a variety of social providers
 * and still have a working demo
 *
 **/

var logger;
freedom.core().getLogger('[Chat Backend]').then(function (log) { logger = log; });

var Chat = function (dispatchEvent) {
  this.dispatchEvent = dispatchEvent;

  this.userList = {};    //Keep track of the roster
  this.clientList = {};
  this.myClientState = null;
  this.social = freedom.socialprovider();

  this.boot();
};

/** 
 * sent messages should be forwarded to the Social provider.
 **/
Chat.prototype.send = function (to, message) {
  return this.social.sendMessage(to, message);
};

Chat.prototype.boot = function () {
  this.social.login({
    agent: 'chatdemo',
    version: '0.1',
    url: '',
    interactive: true,
    rememberLogin: false
  }).then(function (ret) {
    this.myClientState = ret;
    logger.log("onLogin", this.myClientState);
    if (ret.status === this.social.STATUS.ONLINE) {
      this.dispatchEvent('recv-uid', ret.clientId);
      this.dispatchEvent('recv-status', "online");
    } else {
      this.dispatchEvent('recv-status', "offline");
    }
  }.bind(this), function (err) {
    logger.log("Log In Failed", err);
    this.dispatchEvent("recv-err", err);
  }.bind(this));

  this.updateBuddyList();

  /**
  * on an 'onMessage' event from the Social provider
  * Just forward it to the outer page
  */
  this.social.on('onMessage', function (data) {
    logger.info("Message Received", data);
    this.dispatchEvent('recv-message', data);
  }.bind(this));
  
  /**
  * On user profile changes, let's keep track of them
  **/
  this.social.on('onUserProfile', function (data) {
    //Just save it for now
    this.userList[data.userId] = data;
    this.updateBuddyList();
  }.bind(this));
  
  /**
  * On newly online or offline clients, let's update the roster
  **/
  this.social.on('onClientState', function (data) {
    logger.debug("Roster Change", data);
    if (data.status === this.social.STATUS.OFFLINE) {
      if (this.clientList.hasOwnProperty(data.clientId)) {
        delete this.clientList[data.clientId];
      }
    } else {  //Only track non-offline clients
      this.clientList[data.clientId] = data;
    }
    //If mine, send to the page
    if (this.myClientState !== null && data.clientId === this.myClientState.clientId) {
      if (data.status === this.social.STATUS.ONLINE) {
        this.dispatchEvent('recv-status', "online");
      } else {
        this.dispatchEvent('recv-status', "offline");
      }
    }
    
    this.updateBuddyList();
  }.bind(this));
};

Chat.prototype.updateBuddyList = function () {
  // Iterate over our roster and send over user profiles where there is at least 1 client online
  var buddylist = {}, k, userId;
  for (k in this.clientList) {
    if (this.clientList.hasOwnProperty(k)) {
      userId = this.clientList[k].userId;
      if (this.userList[userId]) {
        buddylist[userId] = this.userList[userId];
      }
    }
  }
  this.dispatchEvent('recv-buddylist', buddylist);
};

freedom().providePromises(Chat);
