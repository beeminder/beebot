/**
 * {@link https://api.slack.com/types/channel|Channel}
 */

var bind = require('lodash').bind;
var inherits = require('inherits');
var isUndefined = require('lodash').isUndefined;

var ChannelGroup = require('../node-slack/channel-group');


var Channel = function (opts) {
    ChannelGroup.call(this, 'Channel', opts);
};

inherits(Channel, ChannelGroup);


Channel.prototype.setProperties = function (opts) {
    Channel.super_.prototype.setProperties.call(this, opts);

    this.isChannel = isUndefined(opts.isChannel) ? true : opts.isChannel;
    this.isGeneral = isUndefined(opts.isGeneral) ? false : opts.isGeneral;
    this.isMember = isUndefined(opts.isMember) ? false : opts.isMember;
};


module.exports = Channel;
