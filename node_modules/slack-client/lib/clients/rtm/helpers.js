/**
 *
 */

var RTM_EVENTS = require('./events/rtm-events').EVENTS;


/**
 *
 * @param {string} subtype
 * @param {string} delim
 */
var makeMessageEventWithSubtype = function(subtype, delim) {
    return [RTM_EVENTS.MESSAGE, subtype].join(delim || '::');
};


module.exports.makeMessageEventWithSubtype = makeMessageEventWithSubtype;
