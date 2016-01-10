/**
 * API Facet to make calls to methods in the api namespace.
 *
 * This provides functions to call:
 *   - test: {@link https://api.slack.com/methods/api.test|api.test}
 *
 * NOTE: This file was auto-generated and should not be edited manually.
 */


var ApiFacet = function (makeAPICall) {
    this.name = 'api';
    this.makeAPICall = makeAPICall;
};


/**
 * Checks API calling code.
 * @see {@link https://api.slack.com/methods/api.test|api.test}
 *
 * @param {Object=} opts
 * @param {?} opts.error Error response to return
 * @param {?} opts.foo example property to return
 * @param {function} opt_cb Optional callback, if not using promises.
 */
ApiFacet.prototype.test = function (opts, opt_cb) {
    var args = {
        opts: opts
    };

    return this.makeAPICall('api.test', args, opt_cb);
};


module.exports = ApiFacet;
