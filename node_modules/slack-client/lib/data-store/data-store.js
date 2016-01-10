/**
 * Interface for creating a data store object for caching information from the Slack APIs.
 */

var forEach = require('lodash').forEach;
var models = require('../models');


var SlackDataStore = function() {

};


/**
 * Clears the data store and re-sets it to the required starting state.
 */
SlackDataStore.prototype.clear = function() {

};


// ###############################################
// Getters
// ###############################################

/**
 * Returns the User object matching the supplied id.
 * @param {string} userId
 * @returns {Object}
 */
SlackDataStore.prototype.getUserById = function(userId) {
};


/**
 * Returns the User object matching the supplied name.
 * @param {string} name
 * @returns {Object}
 */
SlackDataStore.prototype.getUserByName = function(name) {
};


/**
 * Returns the User object matching the supplied email.
 * @param {string} email
 * @returns {Object}
 */
SlackDataStore.prototype.getUserByEmail = function(email) {
};


/**
 * Returns the Channel object matching the supplied id.
 * @param channelId
 * @returns {Object}
 */
SlackDataStore.prototype.getChannelById = function(channelId) {
};


/**
 * Returns the Channel object matching the supplied name.
 * @param name
 * @returns {Object}
 */
SlackDataStore.prototype.getChannelByName = function(name) {
};


/**
 * Returns the Group object matching the supplied id.
 * @param groupId
 * @returns {Object}
 */
SlackDataStore.prototype.getGroupById = function(groupId) {
};


/**
 * Returns the Group object matching the supplied name.
 * @param name
 * @returns {Object}
 */
SlackDataStore.prototype.getGroupByName = function(name) {

};


/**
 * Returns the DM object matching the supplied id.
 * @param dmId
 * @returns {Object}
 */
SlackDataStore.prototype.getDMById = function(dmId) {

};


/**
 * Returns the bot object matching the supplied id.
 * @param botId
 * @returns {Object}
 */
SlackDataStore.prototype.getBotById = function(botId) {

};


/**
 * Returns the bot object matching the supplied name.
 * @param {string} name
 * @returns {Object}
 */
SlackDataStore.prototype.getBotByName = function(name) {

};


/**
 * Returns the bot object matching the supplied name.
 * @param {string} name
 * @returns {Object}
 */
SlackDataStore.prototype.getTeamById = function(name) {

};


/**
 * Returns the unread count for all objects: channels, groups etc.
 */
SlackDataStore.prototype.getUnreadCount = function() {
};


// ###############################################
// Setters
// ###############################################


/**
 * Stores a channel object in the data store.
 * @param {Object} channel
 */
SlackDataStore.prototype.setChannel = function(channel) {
};


/**
 *
 * @param {Object} group
 */
SlackDataStore.prototype.setGroup = function(group) {
};


/**
 *
 * @param {Object} dm
 */
SlackDataStore.prototype.setDM = function(dm) {
};


/**
 *
 * @param {Object} user
 */
SlackDataStore.prototype.setUser = function(user) {
};


/**
 *
 * @param {Object} bot
 */
SlackDataStore.prototype.setBot = function(bot) {
};


/**
 * @param {Object} team
 */
SlackDataStore.prototype.setTeam = function(team) {
};


// ###############################################
// Deletion methods
// ###############################################


SlackDataStore.prototype.removeChannel = function(channelId) {
};


SlackDataStore.prototype.removeGroup = function(groupId) {
};


SlackDataStore.prototype.removeDM = function(dmId) {
};


SlackDataStore.prototype.removeUser = function(userId) {
};


SlackDataStore.prototype.removeBot = function(botId) {
};


SlackDataStore.prototype.removeTeam = function(teamId) {
};

// ###############################################
// Helpers
// ###############################################


/**
 * Returns the channel, group or DM object matching the supplied Id.
 * @param objId
 * @returns {Object}
 */
SlackDataStore.prototype.getChannelGroupOrDMById = function(objId) {
    var firstChar = objId.substring(0, 1);

    if (firstChar === 'C') {
        return this.getChannelById(objId);
    } else if (firstChar === 'G') {
        return this.getGroupById(objId);
    } else if (firstChar === 'D') {
        return this.getDMById(objId);
    }
};


/**
 * Returns the channel, group or DM object matching the supplied name, finding by channel, then group then DM.
 * @param objId
 * @returns {Object}
 */
SlackDataStore.prototype.getChannelOrGroupByName = function(name) {
    var channel = this.getChannelByName(name);
    return channel ? channel : this.getGroupByName(name);
};


/**
 * Caches an {@link https://api.slack.com/methods/rtm.start|rtm.start} response to the datastore.
 * @param {Object} data
 */
SlackDataStore.prototype.cacheRtmStart = function(data) {
    this.clear();

    forEach(data.users || [], function(user) {
        this.setUser(new models.User(user));
    }, this);
    forEach(data.channels || [], function(channel) {
        this.setChannel(new models.Channel(channel));
    }, this);
    forEach(data.ims || [], function(dm) {
        this.setDM(new models.DM(dm));
    }, this);
    forEach(data.groups || [], function(group) {
        this.setGroup(new models.Group(group));
    }, this);
    forEach(data.bots || [], function(bot) {
        this.setBot(new models.Bot(bot));
    }, this);

    // TODO(leah): Figure out how to manage updates / merges for objects instead of throwing away data? e.g. you get a self user with prefs set, don't want to lose the prefs when a less complete object is received.
    this.setUser(data.self);
    this.setTeam(data.team);
};


module.exports = SlackDataStore;
