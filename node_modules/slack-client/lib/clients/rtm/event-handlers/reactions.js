/**
 * Handlers for all RTM `reaction_xxx` events.
 */

var partial = require('lodash').partial;
var zipObject = require('lodash').zipObject;

var RTM_EVENTS = require('../events/rtm-events').EVENTS;


/**
 *
 * @param {Object} dataStore
 * @param {Object} message
 * @param {boolean} isAdded
 */
var toggleReactionForMessage = function(dataStore, message, isAdded) {
    var item = message.item;

    var channel = dataStore.getChannelGroupOrDMById(item.channel);
    var msgObj = channel.getMessageByTs(item.ts);

    // If there's a message in the local cache, update it, otherwise do nothing as the message
    // with reaction will get populated when it's next needed from history.
    if (message) {
        // TODO(leah): Make the reaction object a model?
        var reactionIndex = msgObj.getReactionIndex(message.reaction);
        var reaction = msgObj.reactions[reactionIndex];

        if (reaction) {
            reaction.count = Math.max(reaction.count + (isAdded ? 1 : -1), 0);

            if (isAdded) {
                // NOTE: This will not necessarily be consistent with the users array if the
                //       message is pulled from the server. This is because the server only stores
                //       X users per reaction, whereas the client will store as many as it's
                //       notified about.
                reaction.users.push(message.user);
            } else {
                if (reaction.count === 0) {
                    msgObj.reactions.splice(reactionIndex, 1);
                } else {
                    var userIndex = reaction.users.indexOf(message.user);
                    if (userIndex > -1) {
                        reaction.users.splice(userIndex, 1);
                    }
                }
            }
        } else {
            msgObj.reactions.push({
                name: message.reaction,
                users: [message.user],
                count: 1
            });
        }

    }
};


/**
 *
 * @param {Object} dataStore
 * @param {Object} message
 * @param {boolean} isAdded
 */
var toggleReactionForFile = function(dataStore, message, isAdded) {
    // TODO(leah): Update this once files are supported in the data-store implementation
};


/**
 *
 * @param {Object} dataStore
 * @param {Object} message
 * @param {boolean} isAdded
 */
var toggleReactionForFileComment = function(dataStore, message, isAdded) {
    // TODO(leah): Update this once files are supported in the data-store implementation
};



var toggleReaction = function(isAdded, dataStore, message) {
    var itemType = message.item.type;

    if (itemType === 'file') {
        toggleReactionForFile(dataStore, message, isAdded);
    } else if (itemType === 'file_comment') {
        toggleReactionForFileComment(dataStore, message, isAdded);
    } else if (itemType === 'message') {
        toggleReactionForMessage(dataStore, message, isAdded);
    }
};


var handlers = [
    [RTM_EVENTS.REACTION_ADDED, partial(toggleReaction, true)],
    [RTM_EVENTS.REACTION_REMOVED, partial(toggleReaction, false)]
];


module.exports = zipObject(handlers);
