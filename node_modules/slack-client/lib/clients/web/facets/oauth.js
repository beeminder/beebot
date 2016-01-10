/**
 * API Facet to make calls to methods in the oauth namespace.
 *
 * This provides functions to call:
 *   - access: {@link https://api.slack.com/methods/oauth.access|oauth.access}
 *
 * NOTE: This file was auto-generated and should not be edited manually.
 */


var OauthFacet = function (makeAPICall) {
    this.name = 'oauth';
    this.makeAPICall = makeAPICall;
};


/**
 * Exchanges a temporary OAuth code for an API token.
 * @see {@link https://api.slack.com/methods/oauth.access|oauth.access}
 *
 * @param {?} client_id Issued when you created your application.
 * @param {?} client_secret Issued when you created your application.
 * @param {?} code The `code` param returned via the OAuth callback.
 * @param {Object=} opts
 * @param {?} opts.redirect_uri This must match the originally submitted URI (if one was sent).
 * @param {function} opt_cb Optional callback, if not using promises.
 */
OauthFacet.prototype.access = function (client_id, client_secret, code, opts, opt_cb) {
    var args = {
        client_id: client_id,
        client_secret: client_secret,
        code: code,
        opts: opts
    };

    return this.makeAPICall('oauth.access', args, opt_cb);
};


module.exports = OauthFacet;
