/**
 * API Facet to make calls to methods in the rtm namespace.
 *
 * This provides functions to call:
 *   - start: {@link https://api.slack.com/methods/rtm.start|rtm.start}
 *
 * NOTE: This file was auto-generated and should not be edited manually.
 */


var RtmFacet = function (makeAPICall) {
    this.name = 'rtm';
    this.makeAPICall = makeAPICall;
};


/**
 * Starts a Real Time Messaging session.
 * @see {@link https://api.slack.com/methods/rtm.start|rtm.start}
 *
 * @param {Object=} opts
 * @param {?} opts.simple_latest Return timestamp only for latest message object of each channel (improves performance).
 * @param {?} opts.no_unreads Skip unread counts for each channel (improves performance).
 * @param {function} opt_cb Optional callback, if not using promises.
 */
RtmFacet.prototype.start = function (opts, opt_cb) {
    var args = {
        opts: opts
    };

    return this.makeAPICall('rtm.start', args, opt_cb);
};


module.exports = RtmFacet;
