/*globals fdom:true */
/*jslint indent:2,sloppy:true */

fdom.apis.set("core.oauth", {
  /**
   * Get an oAuth access token from a remote service on behalf of
   * the active user.
   *
   * @method getAuthToken
   * @param {String} url - The URL for the authentication flow
   * @return {String} The access token
   **/
  'getAuthToken': {
    'type': 'method',
    'args': ['string'],
    'ret': 'string',
    'err': {
      'errcode': 'string',
      'message': 'string'
    }
  },

  /**
   * Get supported URL prefixes that will signal the completion of oAuth.
   * Supported URLs are platform dependant.
   *
   * @method getRedirectURI
   * @return {String[]} URL prefixes recognized as oAuth completion.
   */
  'getRedirectURI': {
    'type': 'method',
    'args': [],
    'ret': ['string'],
    'err': {
      'errcode': 'string',
      'message': 'string'
    }
  }
});
