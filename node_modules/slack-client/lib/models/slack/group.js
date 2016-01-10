/**
 * {@link https://api.slack.com/types/group|Group}
 */

var inherits = require('inherits');
var isUndefined = require('lodash').isUndefined;

var ChannelGroup = require('../node-slack/channel-group');


var Group = function(opts) {
    ChannelGroup.call(this, 'Group', opts);
};

inherits(Group, ChannelGroup);


Group.prototype.setProperties = function(opts) {
    Group.super_.prototype.setProperties.call(this, opts);

    this.isGroup = isUndefined(opts.isGroup) ? true : opts.isGroup;

    // NOTE: MPDMs are implemented via groups, so these properties are currently set to distinguish group and MPDM
    this.isMPDM = isUndefined(opts.isMpim) ? false : opts.isMpim;
    this.isOpen = isUndefined(opts.isOpen) ? false : opts.isOpen;
};


module.exports = Group;
