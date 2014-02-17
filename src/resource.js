/*globals fdom:true, XMLHttpRequest, Promise */
/*jslint indent:2,white:true,node:true,sloppy:true */
if (typeof fdom === 'undefined') {
  fdom = {};
}

/**
 * The Resource registry for FreeDOM.  Used to look up requested Resources,
 * and provide lookup and migration of resources.
 * @Class Resource
 * @constructor
 */
var Resource = function() {
  this.files = {};
  this.resolvers = [this.httpResolver];
  this.contentRetreivers = {
    'http': this.xhrRetriever,
    'https': this.xhrRetriever,
    'chrome-extension': this.xhrRetriever,
    'resource': this.xhrRetriever,
    'chrome': this.xhrRetriever,
    'manifest': this.manifestRetriever
  };
};

/**
 * Resolve a resurce URL requested from a module.
 * @method get
 * @param {String} manifest The canonical address of the module requesting.
 * @param {String} url The resource to get.
 * @returns {Promise} A promise for the resource address.
 */
Resource.prototype.get = function(manifest, url) {
  var key = JSON.stringify([manifest, url]);
  
  return new Promise(function(resolve, reject) {
    if (this.files[key]) {
      resolve(this.files[key]);
    } else {
      this.resolve(manifest, url).then(function(key, resolve, address) {
        this.files[key] = address;
        fdom.debug.log('Resolved ' + key + ' to ' + address);
        resolve(address);
      }.bind(this, key, resolve), reject);
    }
  }.bind(this));
};

/**
 * Get the contents of a resource.
 * @method getContents
 * @param {String} url The resource to read.
 * @returns {Promise} A promise for the resource contents.
 */
Resource.prototype.getContents = function(url) {
  return new Promise(function(resolve, reject) {
    var prop;
    if (!url) {
      fdom.debug.warn("Asked to get contents of undefined URL.");
      return reject();
    }
    for (prop in this.contentRetreivers) {
      if (this.contentRetreivers.hasOwnProperty(prop)) {
        if (url.indexOf(prop + "://") === 0) {
          return this.contentRetreivers[prop](url, resolve, reject);
        }
      }
    }
    reject();
  }.bind(this));
};

/**
 * Resolve a resource using known resolvers. Unlike get, resolve does
 * not cache resolved resources.
 * @method resolve
 * @private
 * @param {String} manifest The module requesting the resource.
 * @param {String} url The resource to resolve;
 * @returns {Promise} A promise for the resource address.
 */
Resource.prototype.resolve = function(manifest, url) {
  return new Promise(function(resolve, reject) {
    var promises = [];
    if (url === undefined) {
      return reject();
    }
    fdom.util.eachReverse(this.resolvers, function(resolver) {
      promises.push(new Promise(resolver.bind({}, manifest, url)));
    }.bind(this));
    Promise.race(promises).then(resolve, reject);
  }.bind(this));
};

/**
 * Register resolvers: code that knows how to get resources
 * needed by the runtime. A resolver will be called with four
 * arguments: the absolute manifest of the requester, the
 * resource being requested, and a resolve / reject pair to
 * fulfill a promise.
 * @method addResolver
 * @param {Function} resolver The resolver to add.
 */
Resource.prototype.addResolver = function(resolver) {
  this.resolvers.push(resolver);
};

/**
 * Register retrievers: code that knows how to load resources
 * needed by the runtime. A retriever will be called with a URL
 * to retrieve with a protocol that it is able to handle.
 * @method addRetriever
 * @param {String} proto The protocol to register for.
 * @param {Function} retriever The retriever to add.
 */
Resource.prototype.addRetriever = function(proto, retriever) {
  if (this.contentRetreivers[proto]) {
    fdom.debug.warn("Unwilling to override file retrieval for " + proto);
    return;
  }
  this.contentRetreivers[proto] = retriever;
};

/**
 * Resolve URLs which can be accessed using standard HTTP requests.
 * @method httpResolver
 * @private
 * @param {String} manifest The Manifest URL.
 * @param {String} url The URL to resolve.
 * @param {Function} resolve The promise to complete.
 * @param {Function} reject The promise to reject.
 * @returns {Boolean} True if the URL could be resolved.
 */
Resource.prototype.httpResolver = function(manifest, url, resolve, reject) {
  var protocols = ["http", "https", "chrome", "chrome-extension", "resource"],
      dirname,
      i, protocolIdx, pathIdx,
      path, base;
  for (i = 0; i < protocols.length; i += 1) {
    if (url.indexOf(protocols[i] + "://") === 0) {
      resolve(url);
      return true;
    }
  }
  
  if (!manifest) {
    return false;
  }
  for (i = 0; i < protocols.length; i += 1) {
    if (manifest.indexOf(protocols[i] + "://") === 0 &&
       url.indexOf("://") === -1) {
      dirname = manifest.substr(0, manifest.lastIndexOf("/"));
      protocolIdx = dirname.indexOf("://");
      pathIdx = protocolIdx + 3 + dirname.substr(protocolIdx + 3).indexOf("/");
      path = dirname.substr(pathIdx);
      base = dirname.substr(0, pathIdx);
      if (url.indexOf("/") === 0) {
        resolve(base + url);
      } else {
        resolve(base + path + "/" + url);
      }
      return true;
    }
  }

  return false;
};

/**
 * Retrieve manifest content from a self-descriptive manifest url.
 * These urls are used to reference a manifest without requiring subsequent,
 * potentially non-CORS requests.
 * @method manifestRetriever
 * @private
 * @param {String} manifest The Manifest URL
 * @param {Function} resolve The promise to complete.
 * @param {Function} reject The promise to reject.
 */
Resource.prototype.manifestRetriever = function(manifest, resolve, reject) {
  var data;
  try {
    data = manifest.substr(11);
    resolve(JSON.parse(data));
  } catch(e) {
    console.warn("Invalid manifest URL referenced:" + manifest);
    reject();
  }
};

/**
 * Retrieve resource contents using an XHR request.
 * @method xhrRetriever
 * @private
 * @param {String} url The resource to fetch.
 * @param {Function} resolve The promise to complete.
 * @param {Function} reject The promise to reject.
 */
Resource.prototype.xhrRetriever = function(url, resolve, reject) {
  var ref = new XMLHttpRequest();
  ref.addEventListener('readystatechange', function(resolve, reject) {
    if (ref.readyState === 4 && ref.responseText) {
      resolve(ref.responseText);
    } else if (ref.readyState === 4) {
      console.warn("Failed to load file " + url + ": " + ref.status);
      reject(ref.status);
    }
  }.bind({}, resolve, reject), false);
  ref.overrideMimeType('application/json');
  ref.open("GET", url, true);
  ref.send();
};

/**
 * Defines fdom.resources as a singleton registry for file management.
 */
fdom.resources = new Resource();
