/**
 * Handlers for all RTM `channel_` events.
 */

var zipObject = require('lodash').zipObject;

var RTM_EVENTS = require('../events/rtm-events').EVENTS;

var baseChannelHandlers = require('./base-channel');
var helpers = require('./helpers');
var models = require('../../../models');


var addChannel = function (dataStore, message) {
    var newChannel = new models.Channel(message);
    dataStore.setChannel(newChannel);
};


/** {@link https://api.slack.com/events/channel_created|channel_created} */
var handleChannelCreated = function (dataStore, message) {
    addChannel(dataStore, message.channel);
};


/** {@link https://api.slack.com/events/channel_deleted|channel_deleted} */
var handleChannelDeleted = function (dataStore, message) {
    var channelId = message.channel;
    dataStore.removeChannel(channelId);
};


/** {@link https://api.slack.com/events/channel_joined|channel_joined} */
var handleChannelJoined = function (dataStore, message) {
    addChannel(dataStore, message.channel);
};


var handlers = [
    [RTM_EVENTS.CHANNEL_ARCHIVE, baseChannelHandlers.handleArchive],
    [RTM_EVENTS.CHANNEL_CREATED, handleChannelCreated],
    [RTM_EVENTS.CHANNEL_DELETED, handleChannelDeleted],
    [RTM_EVENTS.CHANNEL_HISTORY_CHANGED, helpers.noopMessage],
    [RTM_EVENTS.CHANNEL_JOINED, handleChannelJoined],
    [RTM_EVENTS.CHANNEL_LEFT, baseChannelHandlers.handleLeave],
    [RTM_EVENTS.CHANNEL_MARKED, baseChannelHandlers.handleChannelGroupOrDMMarked],
    [RTM_EVENTS.CHANNEL_RENAME, baseChannelHandlers.handleRename],
    [RTM_EVENTS.CHANNEL_UNARCHIVE, baseChannelHandlers.handleUnarchive]
];


module.exports = zipObject(handlers);
