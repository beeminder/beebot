/**
 * API Facet to make calls to methods in the emoji namespace.
 *
 * This provides functions to call:
 *   - list: {@link https://api.slack.com/methods/emoji.list|emoji.list}
 *
 * NOTE: This file was auto-generated and should not be edited manually.
 */


var EmojiFacet = function (makeAPICall) {
    this.name = 'emoji';
    this.makeAPICall = makeAPICall;
};


/**
 * Lists custom emoji for a team.
 * @see {@link https://api.slack.com/methods/emoji.list|emoji.list}
 *
 * @param {function} opt_cb Optional callback, if not using promises.
 */
EmojiFacet.prototype.list = function (opt_cb) {
    var args = {};

    return this.makeAPICall('emoji.list', args, opt_cb);
};


module.exports = EmojiFacet;
