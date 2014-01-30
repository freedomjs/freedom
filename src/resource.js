/*globals fdom:true, XMLHttpRequest */
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
 * @returns {fdom.Proxy.Deferred} A promise for the resource address.
 */
Resource.prototype.get = function(manifest, url) {
  var key = JSON.stringify([manifest, url]),
      deferred = fdom.proxy.Deferred();
  if (this.files[key]) {
    deferred.resolve(this.files[key]);
  } else {
    this.resolve(manifest, url).always(function(key, deferred, address) {
      this.files[key] = address;
      fdom.debug.log('Resolved ' + key + ' to ' + address);
      deferred.resolve(address);
    }.bind(this, key, deferred));
  }

  return deferred.promise();
};

/**
 * Get the contents of a resource.
 * @method getContents
 * @param {String} url The resource to read.
 * @returns {fdom.Proxy.Deferred} A promise for the resource contents.
 */
Resource.prototype.getContents = function(url) {
  var prop,
      deferred = fdom.proxy.Deferred();
  if (!url) {
    fdom.debug.warn("Asked to get contents of undefined URL.");
    deferred.reject();
    return deferred.promise();
  }
  for (prop in this.contentRetreivers) {
    if (this.contentRetreivers.hasOwnProperty(prop)) {
      if (url.indexOf(prop + "://") === 0) {
        this.contentRetreivers[prop](url, deferred);
        return deferred.promise();
      }
    }
  }

  deferred.reject();
  return deferred.promise();
};

/**
 * Resolve a resource using known resolvers. Unlike get, resolve does
 * not cache resolved resources.
 * @method resolve
 * @private
 * @param {String} manifest The module requesting the resource.
 * @param {String} url The resource to resolve;
 * @returns {fdom.proxy.Deferred} A promise for the resource address.
 */
Resource.prototype.resolve = function(manifest, url) {
  var deferred = fdom.proxy.Deferred(),
      i = 0;
  if (url === undefined) {
    deferred.reject();
    return deferred.promise();
  }
  for (i = 0; i < this.resolvers.length; i += 1) {
    if(this.resolvers[i](manifest, url, deferred)) {
      return deferred.promise();
    }
  }
  deferred.reject();
  return deferred.promise();
};

/**
 * Register resolvers: code that knows how to get resources
 * needed by the runtime. A resolver will be called with three
 * arguments: the absolute manifest of the requester, the
 * resource being requested, and a deferred object to populate.
 * It returns a boolean of whether or not it can resolve the requested
 * resource.
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
 * @param {fdom.proxy.Deferred} deferred The deferred object to populate.
 * @returns {Boolean} True if the URL could be resolved.
 */
Resource.prototype.httpResolver = function(manifest, url, deferred) {
  var protocols = ["http", "https", "chrome", "chrome-extension", "resource"],
      dirname,
      i, protocolIdx, pathIdx,
      path, base;
  for (i = 0; i < protocols.length; i += 1) {
    if (url.indexOf(protocols[i] + "://") === 0) {
      deferred.resolve(url);
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
        deferred.resolve(base + url);
      } else {
        deferred.resolve(base + path + "/" + url);
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
 * @param {fdom.proxy.Deferred} deferred The deferred object to populate.
 */
Resource.prototype.manifestRetriever = function(manifest, deferred) {
  var data;
  try {
    data = manifest.substr(11);
    deferred.resolve(JSON.parse(data));
  } catch(e) {
    console.warn("Invalid manifest URL referenced:" + manifest);
    deferred.reject();
  }
};

/**
 * Retrieve resource contents using an XHR request.
 * @method xhrRetriever
 * @private
 * @param {String} url The resource to fetch.
 * @param {fdom.proxy.Deferred} deferred The deferred object to populate.
 */
Resource.prototype.xhrRetriever = function(url, deferred) {
  var ref = new XMLHttpRequest();
  ref.addEventListener('readystatechange', function(deferred) {
    if (ref.readyState === 4 && ref.responseText) {
      deferred.resolve(ref.responseText);
    } else if (ref.readyState === 4) {
      console.warn("Failed to load file " + url + ": " + ref.status);
      deferred.reject(ref.status);
    }
  }.bind({}, deferred), false);
  ref.overrideMimeType('application/json');
  ref.open("GET", url, true);
  ref.send();
};

/**
 * Defines fdom.resources as a singleton registry for file management.
 */
fdom.resources = new Resource();
