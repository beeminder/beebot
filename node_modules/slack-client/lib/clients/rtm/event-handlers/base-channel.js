/**
 * Event handlers that can be re-used between channels, groups and DMs
 */


var setBaseChannelProperty = function(val, key) {
    return function(dataStore, message) {
        var obj = dataStore.getChannelGroupOrDMById(message.channel);
        if (obj) {
            obj[key] = val;
        }
    };
};


/**
 * {@link https://api.slack.com/events/channel_marked|channel_marked}
 * {@link https://api.slack.com/events/group_marked|group_marked}
 * {@link https://api.slack.com/events/im_marked|im_marked}
 */
var handleChannelGroupOrDMMarked = function(dataStore, message) {
    var baseChannel = dataStore.getChannelGroupOrDMById(message.channel);

    if (baseChannel) {
        baseChannel.lastRead = message.ts;
        baseChannel.recalcUnreads();
    }
};


/**
 * {@link https://api.slack.com/events/channel_archive|channel_archive}
 * {@link https://api.slack.com/events/group_archive|group_archive}
 */
var handleArchive = setBaseChannelProperty(true, 'isArchived');


/**
 * {@link https://api.slack.com/events/channel_unarchive|channel_unarchive}
 * {@link https://api.slack.com/events/group_unarchive|group_unarchive}
 */
var handleUnarchive = setBaseChannelProperty(false, 'isArchived');


/**
 * {@link https://api.slack.com/events/group_rename|group_rename}
 * {@link https://api.slack.com/events/channel_rename|channel_rename}
 */
var handleRename = function(dataStore, message) {
    var baseChannel = dataStore.getChannelGroupOrDMById(message.channel.id);
    if (baseChannel) {
        baseChannel.name = message.channel.name;
    }
};


/**
 * {@link https://api.slack.com/events/group_left|group_left}
 * {@link https://api.slack.com/events/channel_left|channel_left}
 */
var handleLeave = function(activeUserId, activeTeamId, dataStore, message) {
    var baseChanel = dataStore.getChannelGroupOrDMById(message.channel);
    if (baseChanel) {
        var index = baseChanel.members.indexOf(activeUserId);
        baseChanel.members.splice(index, 1);
    }
};


module.exports.handleChannelGroupOrDMMarked = handleChannelGroupOrDMMarked;
module.exports.handleArchive = handleArchive;
module.exports.handleUnarchive = handleUnarchive;
module.exports.handleRename = handleRename;
module.exports.handleLeave = handleLeave;
