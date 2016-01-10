/**
 * API Facet to make calls to methods in the pins namespace.
 *
 * This provides functions to call:
 *   - add: {@link https://api.slack.com/methods/pins.add|pins.add}
 *   - list: {@link https://api.slack.com/methods/pins.list|pins.list}
 *   - remove: {@link https://api.slack.com/methods/pins.remove|pins.remove}
 *
 * NOTE: This file was auto-generated and should not be edited manually.
 */


var PinsFacet = function (makeAPICall) {
    this.name = 'pins';
    this.makeAPICall = makeAPICall;
};


/**
 * Pins an item to a channel.
 * @see {@link https://api.slack.com/methods/pins.add|pins.add}
 *
 * @param {?} channel Channel to pin the item in.
 * @param {Object=} opts
 * @param {?} opts.file File to pin.
 * @param {?} opts.file_comment File comment to pin.
 * @param {?} opts.timestamp Timestamp of the message to pin.
 * @param {function} opt_cb Optional callback, if not using promises.
 */
PinsFacet.prototype.add = function (channel, opts, opt_cb) {
    var args = {
        channel: channel,
        opts: opts
    };

    return this.makeAPICall('pins.add', args, opt_cb);
};

/**
 * Lists items pinned to a channel.
 * @see {@link https://api.slack.com/methods/pins.list|pins.list}
 *
 * @param {?} channel Channel to get pinned items for.
 * @param {function} opt_cb Optional callback, if not using promises.
 */
PinsFacet.prototype.list = function (channel, opt_cb) {
    var args = {
        channel: channel
    };

    return this.makeAPICall('pins.list', args, opt_cb);
};

/**
 * Un-pins an item from a channel.
 * @see {@link https://api.slack.com/methods/pins.remove|pins.remove}
 *
 * @param {?} channel Channel where the item is pinned to.
 * @param {Object=} opts
 * @param {?} opts.file File to un-pin.
 * @param {?} opts.file_comment File comment to un-pin.
 * @param {?} opts.timestamp Timestamp of the message to un-pin.
 * @param {function} opt_cb Optional callback, if not using promises.
 */
PinsFacet.prototype.remove = function (channel, opts, opt_cb) {
    var args = {
        channel: channel,
        opts: opts
    };

    return this.makeAPICall('pins.remove', args, opt_cb);
};


module.exports = PinsFacet;
