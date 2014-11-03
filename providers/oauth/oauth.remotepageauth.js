/*jslint indent:2,browser:true, node:true */
var PromiseCompat = require('es6-promise').Promise;

var oAuthRedirectId = 'freedom.oauth.redirect.handler';

function RemotePageAuth() {
  this.listeners = {};
}

RemotePageAuth.prototype.initiateOAuth = function(redirectURIs) {
  if (typeof global !== 'undefined' && global && global.document) {
    // TODO: remove restriction on URL pattern match.
    if ((redirectURIs[i].indexOf('http://') === 0 ||
         redirectURIs[i].indexOf('https://') === 0) &&
        redirectURIs[i].indexOf('oauth-relay.html') > 0) {
      return PromiseCompat.resolve({
        redirect: redirectURIs[i],
        state: oAuthRedirectId + Math.random()
      });
      //promises.push(monitorFrame(redirectURIs[i], instance));
    }
  }
  return false;
};

RemotePageAuth.prototype.launchAuthFlow = function(authUrl, stateObj) {
  var promise = new PromiseCompat(function (resolve, reject) {
    var frame = global.document.createElement('iframe');
    frame.src = stateObj.redirect;
    frame.style.display = 'none';

    global.document.body.appendChild(frame);
    frame.addEventListener('load', function () {
      window.open(authUrl);
      this.listeners[stateObj.state] = function (url) {
        resolve(url);
        //this.dispatchEvent("oAuthEvent", url);
      }.bind(oAuth);

      frame.contentWindow.postMessage(stateObj.state, '*');
    }.bind(this));

    window.addEventListener('message', function (frame, msg) {
      if (msg.data && msg.data.key && msg.data.url && listeners[msg.data.key]) {
        this.listeners[msg.data.key](msg.data.url);
        try {
          document.body.removeChild(frame);
        } catch (e) {
          console.warn(e);
        }
      }
    }.bind(this, frame), false);
  });

  //Direct the user to the oAuth flow
  return promise;
};

/**
 * If we have a local domain, and freedom.js is loaded at startup, we can use
 * the local page as a redirect URI.
 */
exports.register = function (OAuth) {
  'use strict';
  OAuth.register(new RemotePageAuth());
};
