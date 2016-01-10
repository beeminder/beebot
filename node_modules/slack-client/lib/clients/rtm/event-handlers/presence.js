/**
 * Event handlers for RTM presence change events.
 */

var zipObject = require('lodash').zipObject;

var RTM_EVENTS = require('../events/rtm-events').EVENTS;


/** {@link https://api.slack.com/events/manual_presence_change|manual_presence_change} */
var handleManualPresenceChange = function(activeUserId, activeTeamId, dataStore, message) {
    var user = dataStore.getUserById(activeUserId);
    user.presence = message.presence;
};


/** {@link https://api.slack.com/events/presence_change|presence_change} */
var handlePresenceChange = function(dataStore, message) {
    var user = dataStore.getUserById(message.user);
    user.presence = message.presence;
};


var handlers = [
    [RTM_EVENTS.MANUAL_PRESENCE_CHANGE, handleManualPresenceChange],
    [RTM_EVENTS.PRESENCE_CHANGE, handlePresenceChange]
];


module.exports = zipObject(handlers);
