/**
 * API Facet to make calls to methods in the stars namespace.
 *
 * This provides functions to call:
 *   - add: {@link https://api.slack.com/methods/stars.add|stars.add}
 *   - list: {@link https://api.slack.com/methods/stars.list|stars.list}
 *   - remove: {@link https://api.slack.com/methods/stars.remove|stars.remove}
 *
 * NOTE: This file was auto-generated and should not be edited manually.
 */


var StarsFacet = function (makeAPICall) {
    this.name = 'stars';
    this.makeAPICall = makeAPICall;
};


/**
 * Adds a star to an item.
 * @see {@link https://api.slack.com/methods/stars.add|stars.add}
 *
 * @param {Object=} opts
 * @param {?} opts.file File to add star to.
 * @param {?} opts.file_comment File comment to add star to.
 * @param {?} opts.channel Channel to add star to, or channel where the message to add star to was posted (used with `timestamp`).
 * @param {?} opts.timestamp Timestamp of the message to add star to.
 * @param {function} opt_cb Optional callback, if not using promises.
 */
StarsFacet.prototype.add = function (opts, opt_cb) {
    var args = {
        opts: opts
    };

    return this.makeAPICall('stars.add', args, opt_cb);
};

/**
 * Lists stars for a user.
 * @see {@link https://api.slack.com/methods/stars.list|stars.list}
 *
 * @param {?} opt_user Show stars by this user. Defaults to the authed user.
 * @param {function} opt_cb Optional callback, if not using promises.
 */
StarsFacet.prototype.list = function (opt_user, opt_cb) {
    var args = {
        user: opt_user
    };

    return this.makeAPICall('stars.list', args, opt_cb);
};

/**
 * Removes a star from an item.
 * @see {@link https://api.slack.com/methods/stars.remove|stars.remove}
 *
 * @param {Object=} opts
 * @param {?} opts.file File to remove star from.
 * @param {?} opts.file_comment File comment to remove star from.
 * @param {?} opts.channel Channel to remove star from, or channel where the message to remove star from was posted (used with `timestamp`).
 * @param {?} opts.timestamp Timestamp of the message to remove star from.
 * @param {function} opt_cb Optional callback, if not using promises.
 */
StarsFacet.prototype.remove = function (opts, opt_cb) {
    var args = {
        opts: opts
    };

    return this.makeAPICall('stars.remove', args, opt_cb);
};


module.exports = StarsFacet;
