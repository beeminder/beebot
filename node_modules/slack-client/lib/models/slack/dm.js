/**
 * {@link https://api.slack.com/types/im|DM}
 */

var inherits = require('inherits');

var BaseChannel = require('../node-slack/base-channel');
var Message = require('../node-slack/message');


var DM = function(opts) {
    BaseChannel.call(this, 'DM', opts);
};

inherits(DM, BaseChannel);


DM.prototype.setProperties = function(opts) {
    DM.super_.prototype.setProperties.call(this, opts);

    this.isDm = opts.isIm;
    this.user = opts.user;
};


module.exports = DM;
