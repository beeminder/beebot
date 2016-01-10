/**
 * Helpers for working with Slack API clients.
 */

var humps = require('humps');


/**
 *
 */
var parseAPIResponse = function(res) {

    try {
        res = JSON.parse(res);
        res = humps.camelizeKeys(res);
    } catch(err) {
        // TODO(leah): Update this to throw a meaningful error
        throw new Error();
    }

    return res;
};


module.exports.parseAPIResponse = parseAPIResponse;
