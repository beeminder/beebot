/**
 * API Facet to make calls to methods in the presence namespace.
 *
 * This provides functions to call:
 *   - set: {@link https://api.slack.com/methods/presence.set|presence.set}
 *
 * NOTE: This file was auto-generated and should not be edited manually.
 */


var PresenceFacet = function (makeAPICall) {
    this.name = 'presence';
    this.makeAPICall = makeAPICall;
};


/**
 * Manually set user presence
 * @see {@link https://api.slack.com/methods/presence.set|presence.set}
 *
 * @param {?} presence Either `active` or `away`
 * @param {function} opt_cb Optional callback, if not using promises.
 */
PresenceFacet.prototype.set = function (presence, opt_cb) {
    var args = {
        presence: presence
    };

    return this.makeAPICall('presence.set', args, opt_cb);
};


module.exports = PresenceFacet;
