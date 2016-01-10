/**
 * Handlers for all RTM `bot_*` events.
 */

var zipObject = require('lodash').zipObject;

var RTM_EVENTS = require('../events/rtm-events').EVENTS;
var models = require('../../../models');


/**
 * {@link https://api.slack.com/events/bot_changed|bot_changed}
 * {@link https://api.slack.com/events/bot_added|bot_added}
 */
var upsertBot = function (dataStore, message) {
    var bot = new models.Bot(message.bot);
    dataStore.setBot(bot);
};


var handlers = [
    [RTM_EVENTS.BOT_ADDED, upsertBot],
    [RTM_EVENTS.BOT_CHANGED, upsertBot]
];


module.exports = zipObject(handlers);
