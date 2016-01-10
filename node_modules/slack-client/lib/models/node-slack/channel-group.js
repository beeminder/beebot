/**
 *
 */

var bind = require('lodash').bind;
var inherits = require('inherits');

var BaseChannel = require('../node-slack/base-channel');
var ChannelGroupMetaInfo = require('../node-slack/channel-group-meta-info');


var ChannelGroup = function(name, opts) {
    BaseChannel.call(this, name, opts);
};

inherits(ChannelGroup, BaseChannel);


ChannelGroup.prototype.setProperties = function(opts) {
    ChannelGroup.super_.prototype.setProperties.call(this, opts);

    this.isArchived = opts.isArchived;
    this.name = opts.name;

    this.members = opts.members || [];
    this.topic = new ChannelGroupMetaInfo(opts.topic);
    this.purpose = new ChannelGroupMetaInfo(opts.purpose);
};


module.exports = ChannelGroup;
