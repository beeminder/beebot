/**
 * API Facet to make calls to methods in the reactions namespace.
 *
 * This provides functions to call:
 *   - add: {@link https://api.slack.com/methods/reactions.add|reactions.add}
 *   - get: {@link https://api.slack.com/methods/reactions.get|reactions.get}
 *   - list: {@link https://api.slack.com/methods/reactions.list|reactions.list}
 *   - remove: {@link https://api.slack.com/methods/reactions.remove|reactions.remove}
 *
 * NOTE: This file was auto-generated and should not be edited manually.
 */


var ReactionsFacet = function (makeAPICall) {
    this.name = 'reactions';
    this.makeAPICall = makeAPICall;
};


/**
 * Adds a reaction to an item.
 * @see {@link https://api.slack.com/methods/reactions.add|reactions.add}
 *
 * @param {?} name Reaction (emoji) name.
 * @param {Object=} opts
 * @param {?} opts.file File to add reaction to.
 * @param {?} opts.file_comment File comment to add reaction to.
 * @param {?} opts.channel Channel where the message to add reaction to was posted.
 * @param {?} opts.timestamp Timestamp of the message to add reaction to.
 * @param {function} opt_cb Optional callback, if not using promises.
 */
ReactionsFacet.prototype.add = function (name, opts, opt_cb) {
    var args = {
        name: name,
        opts: opts
    };

    return this.makeAPICall('reactions.add', args, opt_cb);
};

/**
 * Gets reactions for an item.
 * @see {@link https://api.slack.com/methods/reactions.get|reactions.get}
 *
 * @param {Object=} opts
 * @param {?} opts.file File to get reactions for.
 * @param {?} opts.file_comment File comment to get reactions for.
 * @param {?} opts.channel Channel where the message to get reactions for was posted.
 * @param {?} opts.timestamp Timestamp of the message to get reactions for.
 * @param {?} opts.full If true always return the complete reaction list.
 * @param {function} opt_cb Optional callback, if not using promises.
 */
ReactionsFacet.prototype.get = function (opts, opt_cb) {
    var args = {
        opts: opts
    };

    return this.makeAPICall('reactions.get', args, opt_cb);
};

/**
 * Lists reactions made by a user.
 * @see {@link https://api.slack.com/methods/reactions.list|reactions.list}
 *
 * @param {Object=} opts
 * @param {?} opts.user Show reactions made by this user. Defaults to the authed user.
 * @param {?} opts.full If true always return the complete reaction list.
 * @param {function} opt_cb Optional callback, if not using promises.
 */
ReactionsFacet.prototype.list = function (opts, opt_cb) {
    var args = {
        opts: opts
    };

    return this.makeAPICall('reactions.list', args, opt_cb);
};

/**
 * Removes a reaction from an item.
 * @see {@link https://api.slack.com/methods/reactions.remove|reactions.remove}
 *
 * @param {?} name Reaction (emoji) name.
 * @param {Object=} opts
 * @param {?} opts.file File to remove reaction from.
 * @param {?} opts.file_comment File comment to remove reaction from.
 * @param {?} opts.channel Channel where the message to remove reaction from was posted.
 * @param {?} opts.timestamp Timestamp of the message to remove reaction from.
 * @param {function} opt_cb Optional callback, if not using promises.
 */
ReactionsFacet.prototype.remove = function (name, opts, opt_cb) {
    var args = {
        name: name,
        opts: opts
    };

    return this.makeAPICall('reactions.remove', args, opt_cb);
};


module.exports = ReactionsFacet;
