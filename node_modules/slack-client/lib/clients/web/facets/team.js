/**
 * API Facet to make calls to methods in the team namespace.
 *
 * This provides functions to call:
 *   - accessLogs: {@link https://api.slack.com/methods/team.accessLogs|team.accessLogs}
 *   - info: {@link https://api.slack.com/methods/team.info|team.info}
 *
 * NOTE: This file was auto-generated and should not be edited manually.
 */


var TeamFacet = function (makeAPICall) {
    this.name = 'team';
    this.makeAPICall = makeAPICall;
};


/**
 * Gets the access logs for the current team.
 * @see {@link https://api.slack.com/methods/team.accessLogs|team.accessLogs}
 *
 * @param {function} opt_cb Optional callback, if not using promises.
 */
TeamFacet.prototype.accessLogs = function (opt_cb) {
    var args = {};

    return this.makeAPICall('team.accessLogs', args, opt_cb);
};

/**
 * Gets information about the current team.
 * @see {@link https://api.slack.com/methods/team.info|team.info}
 *
 * @param {function} opt_cb Optional callback, if not using promises.
 */
TeamFacet.prototype.info = function (opt_cb) {
    var args = {};

    return this.makeAPICall('team.info', args, opt_cb);
};


module.exports = TeamFacet;
