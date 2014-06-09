/*globals fdom:true */
/*jslint indent:2,sloppy:true */

fdom.apis.set("core.oauth", {
  /**
   * An oAuth event has occured
   * @return {String} The URL received by the oAuth provider.
   **/
  'oAuthEvent': {
    'type': 'event',
    'value': 'string'
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
    'value': [],
    'ret': ['string'],
    'err': {
      'errcode': 'string',
      'message': 'string'
    }
  }
});
