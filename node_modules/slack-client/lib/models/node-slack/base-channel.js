/**
 *
 */

var bind = require('lodash').bind;
var forEachRight = require('lodash').forEachRight;
var find = require('lodash').find;
var findLastIndex = require('lodash').findLastIndex;
var inherits = require('inherits');
var keys = require('lodash').keys;

var Message = require('./message');
var Model = require('../model');


var BaseChannel = function(objectName, opts) {

    /**
     *
     * @type {Array}
     */
    this.history = [];

    /**
     *
     * @type {string}
     * @private
     */
    this._maxTs = '0000000000.000000';

    /**
     * An object, keyed on user id, values of timeouts that will be run to clear the user typing state.
     * @type {{}}
     * @private
     */
    this._typing = {};

    Model.call(this, objectName, opts);
};

inherits(BaseChannel, Model);


/**
 * The timeout after which the user typing entry should be removed.
 * @type {number}
 */
BaseChannel.prototype.USER_TYPING_TIMEOUT = 5000;


/** @inheritdoc */
BaseChannel.prototype.setProperties = function(opts) {
    BaseChannel.super_.prototype.setProperties.call(this, opts);

    this.id = opts.id;
    this.created = opts.created;
    this.creator = opts.creator;
    this.hasPins = opts.hasPins || false;
    this.lastRead = opts.lastRead || '0000000000.000000';
    this.unreadCount = opts.unreadCount || 0;
    this.unreadCountDisplay = opts.unreadCountDisplay || 0;
    this.isOpen = opts.isOpen || false;

    if (opts.latest) {
        var latestMessage = new Message(opts.latest);
        this.latest = latestMessage;
        this.addMessage(latestMessage);
        this._maxTs = this.latest.ts;
    } else {
        this._maxTs = '0000000000.000000';
    }
};


/**
 *
 * @param {Object} user
 */
BaseChannel.prototype.startedTyping = function(userId) {
    if (this._typing[userId]) {
        clearTimeout(this._typing[userId])
    }

    this._typing[userId] = setTimeout(bind(function() {
        delete this._typing[userId];
        // TODO(leah): Emit an event or something in response to user typing changes?
    }, this), this.USER_TYPING_TIMEOUT);
};


/**
 *
 * @returns {number}
 */
BaseChannel.prototype.recalcUnreads = function() {
    this.unreadCount = 0;
    forEachRight(this.history, function(message) {
        if (message.ts > this.lastRead) {
            this.unreadCount++;
        } else {
            return false;
        }
    }, this);

    return this.unreadCount;
};


/**
 * Returns the string form of the channel type.
 * @return {string}
 */
BaseChannel.prototype.getType = function() {
    return this._modelName.toLowerCase();
};


/**
 * Returns an array of user ids for all users who are currently typing.
 * @return {Array.<string>}
 */
BaseChannel.prototype.getTypingUsers = function() {
    return keys(this._typing);
};


/**
 *
 * @param ts
 */
BaseChannel.prototype.getMessageByTs = function(ts) {
    // This has the potential to get really slow, but ok for now I guess...
    return find(this.history, {ts: ts});
};


/**
 *
 * @param {Object} message
 */
BaseChannel.prototype.addMessage = function(message) {

    // TODO(leah): Do a reverse walk of this and compare the timestamps as an extra guarantee?
    this.history.push(message);

    this._maxTs = message.ts;

    //if message.ts and not message.hidden and @latest? and @latest.ts? and message.ts > @latest.ts
    //  @unread_count++
    //  @latest = message
    //
    //if @_client.autoMark then @mark message.ts
};


BaseChannel.prototype.updateMessage = function(messageUpdatedMsg) {
    var message = messageUpdatedMsg.message;
    var msgIndex = findLastIndex(this.history, 'ts', message.ts);
    if (msgIndex !== -1) {
        this.history[msgIndex] = message;
    }
};


module.exports = BaseChannel;
