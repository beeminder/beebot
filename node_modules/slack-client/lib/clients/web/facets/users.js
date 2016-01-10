/**
 * API Facet to make calls to methods in the users namespace.
 *
 * This provides functions to call:
 *   - getPresence: {@link https://api.slack.com/methods/users.getPresence|users.getPresence}
 *   - info: {@link https://api.slack.com/methods/users.info|users.info}
 *   - list: {@link https://api.slack.com/methods/users.list|users.list}
 *   - setActive: {@link https://api.slack.com/methods/users.setActive|users.setActive}
 *   - setPresence: {@link https://api.slack.com/methods/users.setPresence|users.setPresence}
 *
 * NOTE: This file was auto-generated and should not be edited manually.
 */

var UsersFacet = function (makeAPICall) {
    this.name = 'users';
    this.makeAPICall = makeAPICall;
};


/**
 * Gets user presence information.
 * @see {@link https://api.slack.com/methods/users.getPresence|users.getPresence}
 *
 * @param {?} user User to get presence info on. Defaults to the authed user.
 * @param {function} opt_cb Optional callback, if not using promises.
 */
UsersFacet.prototype.getPresence = function (user, opt_cb) {
    var args = {
        user: user
    };

    return this.makeAPICall('users.getPresence', args, opt_cb);
};

/**
 * Gets information about a user.
 * @see {@link https://api.slack.com/methods/users.info|users.info}
 *
 * @param {?} user User to get info on
 * @param {function} opt_cb Optional callback, if not using promises.
 */
UsersFacet.prototype.info = function (user, opt_cb) {
    var args = {
        user: user
    };

    return this.makeAPICall('users.info', args, opt_cb);
};

/**
 * Lists all users in a Slack team.
 * @see {@link https://api.slack.com/methods/users.list|users.list}
 *
 * @param {?} opt_presence Whether to include presence data in the output
 * @param {function} opt_cb Optional callback, if not using promises.
 */
UsersFacet.prototype.list = function (opt_presence, opt_cb) {
    var args = {
        presence: opt_presence
    };

    return this.makeAPICall('users.list', args, opt_cb);
};

/**
 * Marks a user as active.
 * @see {@link https://api.slack.com/methods/users.setActive|users.setActive}
 *
 * @param {function} opt_cb Optional callback, if not using promises.
 */
UsersFacet.prototype.setActive = function (opt_cb) {
    var args = {};

    return this.makeAPICall('users.setActive', args, opt_cb);
};

/**
 * Manually sets user presence.
 * @see {@link https://api.slack.com/methods/users.setPresence|users.setPresence}
 *
 * @param {?} presence Either `auto` or `away`
 * @param {function} opt_cb Optional callback, if not using promises.
 */
UsersFacet.prototype.setPresence = function (presence, opt_cb) {
    var args = {
        presence: presence
    };

    return this.makeAPICall('users.setPresence', args, opt_cb);
};


module.exports = UsersFacet;
