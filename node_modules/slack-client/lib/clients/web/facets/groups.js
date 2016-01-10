/**
 * API Facet to make calls to methods in the groups namespace.
 *
 * This provides functions to call:
 *   - archive: {@link https://api.slack.com/methods/groups.archive|groups.archive}
 *   - close: {@link https://api.slack.com/methods/groups.close|groups.close}
 *   - create: {@link https://api.slack.com/methods/groups.create|groups.create}
 *   - createChild: {@link https://api.slack.com/methods/groups.createChild|groups.createChild}
 *   - history: {@link https://api.slack.com/methods/groups.history|groups.history}
 *   - info: {@link https://api.slack.com/methods/groups.info|groups.info}
 *   - invite: {@link https://api.slack.com/methods/groups.invite|groups.invite}
 *   - kick: {@link https://api.slack.com/methods/groups.kick|groups.kick}
 *   - leave: {@link https://api.slack.com/methods/groups.leave|groups.leave}
 *   - list: {@link https://api.slack.com/methods/groups.list|groups.list}
 *   - mark: {@link https://api.slack.com/methods/groups.mark|groups.mark}
 *   - open: {@link https://api.slack.com/methods/groups.open|groups.open}
 *   - rename: {@link https://api.slack.com/methods/groups.rename|groups.rename}
 *   - setPurpose: {@link https://api.slack.com/methods/groups.setPurpose|groups.setPurpose}
 *   - setTopic: {@link https://api.slack.com/methods/groups.setTopic|groups.setTopic}
 *   - unarchive: {@link https://api.slack.com/methods/groups.unarchive|groups.unarchive}
 *
 * NOTE: This file was auto-generated and should not be edited manually.
 */


var GroupsFacet = function (makeAPICall) {
    this.name = 'groups';
    this.makeAPICall = makeAPICall;
};


/**
 * Archives a private group.
 * @see {@link https://api.slack.com/methods/groups.archive|groups.archive}
 *
 * @param {?} channel Private group to archive
 * @param {function} opt_cb Optional callback, if not using promises.
 */
GroupsFacet.prototype.archive = function (channel, opt_cb) {
    var args = {
        channel: channel
    };

    return this.makeAPICall('groups.archive', args, opt_cb);
};

/**
 * Closes a private group.
 * @see {@link https://api.slack.com/methods/groups.close|groups.close}
 *
 * @param {?} channel Group to open.
 * @param {function} opt_cb Optional callback, if not using promises.
 */
GroupsFacet.prototype.close = function (channel, opt_cb) {
    var args = {
        channel: channel
    };

    return this.makeAPICall('groups.close', args, opt_cb);
};

/**
 * Creates a private group.
 * @see {@link https://api.slack.com/methods/groups.create|groups.create}
 *
 * @param {?} name Name of group to create
 * @param {function} opt_cb Optional callback, if not using promises.
 */
GroupsFacet.prototype.create = function (name, opt_cb) {
    var args = {
        name: name
    };

    return this.makeAPICall('groups.create', args, opt_cb);
};

/**
 * Clones and archives a private group.
 * @see {@link https://api.slack.com/methods/groups.createChild|groups.createChild}
 *
 * @param {?} channel Group to clone and archive.
 * @param {function} opt_cb Optional callback, if not using promises.
 */
GroupsFacet.prototype.createChild = function (channel, opt_cb) {
    var args = {
        channel: channel
    };

    return this.makeAPICall('groups.createChild', args, opt_cb);
};

/**
 * Fetches history of messages and events from a private group.
 * @see {@link https://api.slack.com/methods/groups.history|groups.history}
 *
 * @param {?} channel Group to fetch history for.
 * @param {Object=} opts
 * @param {?} opts.latest End of time range of messages to include in results.
 * @param {?} opts.oldest Start of time range of messages to include in results.
 * @param {?} opts.inclusive Include messages with latest or oldest timestamp in results.
 * @param {?} opts.count Number of messages to return, between 1 and 1000.
 * @param {function} opt_cb Optional callback, if not using promises.
 */
GroupsFacet.prototype.history = function (channel, opts, opt_cb) {
    var args = {
        channel: channel,
        opts: opts
    };

    return this.makeAPICall('groups.history', args, opt_cb);
};

/**
 * Gets information about a private group.
 * @see {@link https://api.slack.com/methods/groups.info|groups.info}
 *
 * @param {?} channel Group to get info on
 * @param {function} opt_cb Optional callback, if not using promises.
 */
GroupsFacet.prototype.info = function (channel, opt_cb) {
    var args = {
        channel: channel
    };

    return this.makeAPICall('groups.info', args, opt_cb);
};

/**
 * Invites a user to a private group.
 * @see {@link https://api.slack.com/methods/groups.invite|groups.invite}
 *
 * @param {?} channel Private group to invite user to.
 * @param {?} user User to invite.
 * @param {function} opt_cb Optional callback, if not using promises.
 */
GroupsFacet.prototype.invite = function (channel, user, opt_cb) {
    var args = {
        channel: channel,
        user: user
    };

    return this.makeAPICall('groups.invite', args, opt_cb);
};

/**
 * Removes a user from a private group.
 * @see {@link https://api.slack.com/methods/groups.kick|groups.kick}
 *
 * @param {?} channel Group to remove user from.
 * @param {?} user User to remove from group.
 * @param {function} opt_cb Optional callback, if not using promises.
 */
GroupsFacet.prototype.kick = function (channel, user, opt_cb) {
    var args = {
        channel: channel,
        user: user
    };

    return this.makeAPICall('groups.kick', args, opt_cb);
};

/**
 * Leaves a private group.
 * @see {@link https://api.slack.com/methods/groups.leave|groups.leave}
 *
 * @param {?} channel Group to leave
 * @param {function} opt_cb Optional callback, if not using promises.
 */
GroupsFacet.prototype.leave = function (channel, opt_cb) {
    var args = {
        channel: channel
    };

    return this.makeAPICall('groups.leave', args, opt_cb);
};

/**
 * Lists private groups that the calling user has access to.
 * @see {@link https://api.slack.com/methods/groups.list|groups.list}
 *
 * @param {?} opt_exclude_archived Don't return archived groups.
 * @param {function} opt_cb Optional callback, if not using promises.
 */
GroupsFacet.prototype.list = function (opt_exclude_archived, opt_cb) {
    var args = {
        exclude_archived: opt_exclude_archived
    };

    return this.makeAPICall('groups.list', args, opt_cb);
};

/**
 * Sets the read cursor in a private group.
 * @see {@link https://api.slack.com/methods/groups.mark|groups.mark}
 *
 * @param {?} channel Group to set reading cursor in.
 * @param {?} ts Timestamp of the most recently seen message.
 * @param {function} opt_cb Optional callback, if not using promises.
 */
GroupsFacet.prototype.mark = function (channel, ts, opt_cb) {
    var args = {
        channel: channel,
        ts: ts
    };

    return this.makeAPICall('groups.mark', args, opt_cb);
};

/**
 * Opens a private group.
 * @see {@link https://api.slack.com/methods/groups.open|groups.open}
 *
 * @param {?} channel Group to open.
 * @param {function} opt_cb Optional callback, if not using promises.
 */
GroupsFacet.prototype.open = function (channel, opt_cb) {
    var args = {
        channel: channel
    };

    return this.makeAPICall('groups.open', args, opt_cb);
};

/**
 * Renames a private group.
 * @see {@link https://api.slack.com/methods/groups.rename|groups.rename}
 *
 * @param {?} channel Group to rename
 * @param {?} name New name for group.
 * @param {function} opt_cb Optional callback, if not using promises.
 */
GroupsFacet.prototype.rename = function (channel, name, opt_cb) {
    var args = {
        channel: channel,
        name: name
    };

    return this.makeAPICall('groups.rename', args, opt_cb);
};

/**
 * Sets the purpose for a private group.
 * @see {@link https://api.slack.com/methods/groups.setPurpose|groups.setPurpose}
 *
 * @param {?} channel Private group to set the purpose of
 * @param {?} purpose The new purpose
 * @param {function} opt_cb Optional callback, if not using promises.
 */
GroupsFacet.prototype.setPurpose = function (channel, purpose, opt_cb) {
    var args = {
        channel: channel,
        purpose: purpose
    };

    return this.makeAPICall('groups.setPurpose', args, opt_cb);
};

/**
 * Sets the topic for a private group.
 * @see {@link https://api.slack.com/methods/groups.setTopic|groups.setTopic}
 *
 * @param {?} channel Private group to set the topic of
 * @param {?} topic The new topic
 * @param {function} opt_cb Optional callback, if not using promises.
 */
GroupsFacet.prototype.setTopic = function (channel, topic, opt_cb) {
    var args = {
        channel: channel,
        topic: topic
    };

    return this.makeAPICall('groups.setTopic', args, opt_cb);
};

/**
 * Unarchives a private group.
 * @see {@link https://api.slack.com/methods/groups.unarchive|groups.unarchive}
 *
 * @param {?} channel Group to unarchive
 * @param {function} opt_cb Optional callback, if not using promises.
 */
GroupsFacet.prototype.unarchive = function (channel, opt_cb) {
    var args = {
        channel: channel
    };

    return this.makeAPICall('groups.unarchive', args, opt_cb);
};


module.exports = GroupsFacet;
