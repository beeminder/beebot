/**
 *
 */

var inherits = require('inherits');

var Model = require('../model');


var ChannelGroupMetaInfo = function (opts) {
    Model.call(this, 'ChannelGroupMetaInfo', opts);
};

inherits(ChannelGroupMetaInfo, Model);


ChannelGroupMetaInfo.prototype.setProperties = function (opts) {
    ChannelGroupMetaInfo.super_.prototype.setProperties.call(this, opts);

    this.value = opts.value || '';
    this.creator = opts.creator;
    this.lastSet = opts.lastSet || '0000000000.000000';
};


module.exports = ChannelGroupMetaInfo;
