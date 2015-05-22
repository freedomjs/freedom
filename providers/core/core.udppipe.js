/*globals chrome,console,Promise,Components,nsIUDPSocketListener*/
/*jslint indent:2,white:true,node:true,sloppy:true,newcap:true */
var PromiseCompat = require('es6-promise').Promise;

function UDP_Firefox(cap, dispatchEvent) {
  this.dispatchEvent = dispatchEvent;
  // http://dxr.mozilla.org/mozilla-central/source/netwerk/base/public/nsIUDPSocket.idl
  this._nsIUDPSocket = Components.classes["@mozilla.org/network/udp-socket;1"]
    .createInstance(Components.interfaces.nsIUDPSocket);
}

UDP_Firefox.prototype.bind = function(address, port, continuation) {
  if (port < 1) {
    port = -1;
  }
  try {
    this._nsIUDPSocket.init(port, false);
    this._nsIUDPSocket.asyncListen(new nsIUDPSocketListener(this));
    continuation(0);
  } catch (e) {
    continuation(-1);
  }
};

UDP_Firefox.prototype.getInfo = function(continuation) {
  var returnValue = {
    localAddress: "localhost",
    localPort: this._nsIUDPSocket.port
  };
  continuation(returnValue);
};

UDP_Firefox.prototype.sendTo = function(buffer, address, port, continuation) {
  var asArray = [];
  var view = new Uint8Array(buffer);
  for (var i = 0; i < buffer.byteLength; i++) {
    asArray.push(view[i]);
  }
  var bytesWritten = this._nsIUDPSocket.send(address,
                                             port,
                                             asArray,
                                             asArray.length);
  continuation(bytesWritten);
};

UDP_Firefox.prototype.destroy = function(continuation) {
  this._nsIUDPSocket.close();
  continuation();
};

function nsIUDPSocketListener(udpSocket) {
  this._udpSocket = udpSocket;
}

nsIUDPSocketListener.prototype.onPacketReceived = function(nsIUDPSocket,
                                                           message) {
  var eventData = {
    resultCode: 0,
    address: message.fromAddr.address,
    port: message.fromAddr.port,
    data: this.str2ab(message.data)
  };
  this._udpSocket.dispatchEvent("onData",
                                eventData);
};

nsIUDPSocketListener.prototype.onStopListening = function(nsIUDPSocket,
                                                          status) {
};

nsIUDPSocketListener.prototype.str2ab = function(str) {
  var buf = new ArrayBuffer(str.length);
  var bufView = new Uint8Array(buf);
  for (var i=0, strLen=str.length; i<strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
};

/**
 * A freedom.js interface to Chrome sockets
 * @constructor
 * @private
 * @param {} cap Capabilities for the provider
 * @param {Function} dispatchEvent Method for emitting events.
 */
var UdpSocket_chrome = function(cap, dispatchEvent) {
  this.dispatchEvent = dispatchEvent;
  this.id = undefined;
};

/**
 * A static list of active sockets, so that global on-receive messages
 * from chrome can be routed properly.
 * @static
 * @private
 */
UdpSocket_chrome.active = {};

/**
 * Bind the UDP Socket to a specific host and port.
 * If no addres is specified, 0.0.0.0 will be used.
 * If no port is specified, a local port will be chosen.
 * @param {String?} address The interface to bind on.
 * @param {number?} port The port to bind on
 * @param {Function} continuation A function to call after binding.
 */
UdpSocket_chrome.prototype.bind = function(address, port, continuation) {
  chrome.sockets.udp.create({}, function(createResult) {
    this.id = createResult.socketId;
    chrome.sockets.udp.bind(this.id, address, port, function(bindResult) {
      if (bindResult >= 0) {
        continuation(bindResult);
        UdpSocket_chrome.addActive(this.id, this);
      } else {
        continuation(undefined, {
          errcode: "BIND_FAILED",
          message: "Failed to Bind: " + bindResult
        });
      }
    }.bind(this));
  }.bind(this));
};

/**
 * Get Information about the socket.
 * @method getInfo
 * @return {Object} connection and address information about the socket.
 */
UdpSocket_chrome.prototype.getInfo = function(continuation) {
  if (this.id) {
    chrome.sockets.udp.getInfo(this.id, continuation);
  } else {
    continuation({
      connected: false
    });
  }
};

UdpSocket_chrome.addActive = function(id, socket) {
  if (Object.keys(UdpSocket_chrome.active).length === 0) {
    chrome.sockets.udp.onReceive.addListener(UdpSocket_chrome.handleReadData);
    chrome.sockets.udp.onReceiveError.addListener(
        UdpSocket_chrome.handleReadError);
  }
  UdpSocket_chrome.active[id] = socket;
};

UdpSocket_chrome.removeActive = function(id) {
  delete UdpSocket_chrome.active[id];
  if (Object.keys(UdpSocket_chrome.active).length === 0) {
    chrome.sockets.udp.onReceive.removeListener(
        UdpSocket_chrome.handleReadData);
    chrome.sockets.udp.onReceiveError.removeListener(
        UdpSocket_chrome.handleReadError);
  }
};


/**
 * Handle data received on a socket
 * @method handleReadData
 * @static
 * @private
 */
UdpSocket_chrome.handleReadData = function(info) {
  UdpSocket_chrome.active[info.socketId].dispatchEvent('onData', {
    resultCode:0,
    address: info.remoteAddress,
    port: info.remotePort,
    data: info.data
  });
};

/**
 * Handle errors received on a socket
 * @method handleReadError
 * @static
 * @private
 */
UdpSocket_chrome.handleReadError = function(info) {
  UdpSocket_chrome.active[info.socketId].dispatchEvent('onData', {
    resultCode:info.resultCode
  });
};

/**
 * Send data on this socket to a host and port.
 * @method sendTo
 * @param {ArrayBuffer} data The data to send.
 * @param {String} address The destination address
 * @param {number} port The destination port
 * @param {Function} cb A function to call after writing completes.
 */
UdpSocket_chrome.prototype.sendTo = function(data, address, port, cb) {
  if (!this.id) {
    cb(undefined, {
      "errcode": "SOCKET_CLOSED",
      "message": "Cannot Write on Closed Socket"
    });
    return;
  }

  chrome.sockets.udp.send(this.id, data, address, port, function(writeInfo) {
    cb(writeInfo.bytesSent);
  });
};

/**
 * Destroy a UDP socket.
 * @method destroy
 * @param {Function} continuation Function to call after socket destroyed.
 */
UdpSocket_chrome.prototype.destroy = function(continuation) {
  if (this.id && this.id !== 'INVALID') {
    chrome.sockets.udp.close(this.id);
    this.id = 'INVALID';
    continuation();
  } else {
    continuation(undefined, {
      "errcode": "SOCKET_CLOSED",
      "message": "Socket Already Closed"
    });
  }
};

var UdpSocket;
if (typeof chrome !== 'undefined') {
  UdpSocket = UdpSocket_chrome;
} else {
  UdpSocket = UDP_Firefox;
}

var _this = this;
/**
 * A Churn Pipe is a transparent obfuscator/deobfuscator for transforming the
 * apparent type of browser-generated UDP datagrams.
 */
var Pipe = (function () {
    // TODO: define a type for event dispatcher in freedom-typescript-api
    function Pipe(dispatchEvent_) {
        var _this = this;
        // Each mirror socket is bound to a port on localhost, and corresponds to a
        // specific remote endpoint.  When the public socket receives an obfuscated
        // packet from that remote endpoint, the mirror socket sends the
        // corresponding deobfuscated message to the browser endpoint.  Similarly,
        // when a mirror socket receives a (unobfuscated) message from the browser
        // endpoint, the public socket sends the corresponding obfuscated packet to
        // that mirror socket's remote endpoint.
        this.mirrorSockets_ = {};
        // Obfuscates and deobfuscates messages.
        //this.transformer_ = makeTransformer_('none');
        // Set the current transformer parameters.  The default is no transformation.
        this.setTransformer = function (transformerName, key, config) {
            return PromiseCompat.resolve(); /*
            try {
                _this.transformer_ = makeTransformer_(transformerName, key, config);
                return PromiseCompat.resolve();
            }
            catch (e) {
                return PromiseCompat.reject(e);
            }*/
        };
        /**
         * Returns a promise to create a socket, bind to the specified address, and
         * start listening for datagrams, which will be deobfuscated and forwarded to the
         * browser endpoint.
         */
        this.bindLocal = function (publicEndpoint) {
            if (_this.publicSocket_) {
                return PromiseCompat.reject(new Error('Churn Pipe cannot rebind the local endpoint'));
            }
            var dispatchPublic = function(name, event) {
              if (name === 'onData') {
                _this.onIncomingData_(event);
              }
            };
            _this.publicSocket_ = new UdpSocket(undefined, dispatchPublic);  //freedom['core.udpsocket']();
            return new PromiseCompat(function(F, R) {
              _this.publicSocket_.bind(publicEndpoint.address, publicEndpoint.port, function (resultCode) {
                if (resultCode !== 0) {
                  R(new Error('bindLocal failed with result code ' + resultCode));
                } else {
                  F();
                }
              });
            });
        };
        this.setBrowserEndpoint = function (browserEndpoint) {
            _this.browserEndpoint_ = browserEndpoint;
            return PromiseCompat.resolve();
        };
        /**
         * Given an endpoint from which obfuscated datagrams may arrive, this method
         * constructs a corresponding mirror socket, and returns its endpoint.
         */
        this.bindRemote = function (remoteEndpoint) {
            return _this.getMirrorSocket_(remoteEndpoint).then(function (mirrorSocket) {
                return new PromiseCompat(function(F, R) {
                  mirrorSocket.getInfo(F);
                });
            }).then(Pipe.endpointFromInfo_);
        };
        this.getMirrorSocket_ = function (remoteEndpoint) {
            var key = Pipe.makeEndpointKey_(remoteEndpoint);
            if (key in _this.mirrorSockets_) {
                return PromiseCompat.resolve(_this.mirrorSockets_[key]);
            }
            var dispatchMirror = function(name, recvFromInfo) {
              if (name === 'onData') {
                _this.sendTo_(recvFromInfo.data, remoteEndpoint);
              }
            };
            var mirrorSocket = new UdpSocket(undefined, dispatchMirror);  //freedom['core.udpsocket']();
            _this.mirrorSockets_[key] = mirrorSocket;
            return new PromiseCompat(function(F, R) {
              mirrorSocket.bind('127.0.0.1', 0, function (resultCode) {
                if (resultCode !== 0) {
                  R(new Error('bindRemote failed with result code ' + resultCode));
                } else {
                  F(mirrorSocket);
                }
              });
            });
        };
        /**
         * Sends a message over the network to the specified destination.
         * The message is obfuscated before it hits the wire.
         */
        this.sendTo_ = function (buffer, to) {
            /*
            var transformedBuffer = _this.transformer_.transform(buffer);
            return _this.publicSocket_.sendTo(transformedBuffer, to.address, to.port).then(function () {
                return PromiseCompat.resolve();
            });
            */
            return new PromiseCompat(function(F, R) {
              _this.publicSocket_.sendTo(buffer, to.address, to.port, F);
            });
        };
        /**
         * Called when a message is received over the network from the remote side.
         * The message is de-obfuscated before being passed to the browser endpoint
         * via a corresponding mirror socket.
         */
        this.onIncomingData_ = function (recvFromInfo) {
            /*
            var transformedBuffer = recvFromInfo.data;
            var buffer = _this.transformer_.restore(transformedBuffer);
            */
            var buffer = recvFromInfo.data;
            var source = {
                address: recvFromInfo.address,
                port: recvFromInfo.port
            };
            _this.getMirrorSocket_(source).then(function (mirrorSocket) {
                mirrorSocket.sendTo(buffer, _this.browserEndpoint_.address, _this.browserEndpoint_.port, function() {});
            });
        };
    }
    Pipe.endpointFromInfo_ = function (socketInfo) {
        return {
            // freedom-for-firefox currently reports the bound address as 'localhost',
            // which is unsupported in candidate lines by Firefox:
            //   https://github.com/freedomjs/freedom-for-firefox/issues/62
            address: '127.0.0.1',
            port: socketInfo.localPort
        };
    };
    Pipe.makeEndpointKey_ = function (endpoint) {
        return endpoint.address + ':' + endpoint.port;
    };
    return Pipe;
})();

exports.name = "core.udppipe";
exports.provider = Pipe;
exports.style = "providePromises";
exports.flags = { provider: true };
