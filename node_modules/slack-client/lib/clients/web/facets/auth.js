/**
 * API Facet to make calls to methods in the auth namespace.
 *
 * This provides functions to call:
 *   - test: {@link https://api.slack.com/methods/auth.test|auth.test}
 *
 * NOTE: This file was auto-generated and should not be edited manually.
 */


var AuthFacet = function (makeAPICall) {
    this.name = 'auth';
    this.makeAPICall = makeAPICall;
};


/**
 * Checks authentication & identity.
 * @see {@link https://api.slack.com/methods/auth.test|auth.test}
 *
 * @param {function} opt_cb Optional callback, if not using promises.
 */
AuthFacet.prototype.test = function (opt_cb) {
    var args = {};

    return this.makeAPICall('auth.test', args, opt_cb);
};


module.exports = AuthFacet;
