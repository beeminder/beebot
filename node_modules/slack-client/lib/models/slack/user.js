/**
 *
 */

var inherits = require('inherits');
var isEmpty = require('lodash').isEmpty;
var isUndefined = require('lodash').isUndefined;

var Model = require('../model');


var User = function(opts) {
    Model.call(this, 'User', opts);
};

inherits(User, Model);


User.prototype.setProperties = function(opts) {
    User.super_.prototype.setProperties.call(this, opts);

    this.id = opts.id;
    this.name = opts.name;
    this.deleted = isUndefined(opts.deleted) ? false : opts.deleted;
    this.status = isUndefined(opts.status) ? '' : opts.status;
    // Don't do any coercion on prefs, just take the plain object
    this.prefs = isUndefined(opts.prefs) ? {} : opts.prefs;
    this.color = isUndefined(opts.color) ? null : opts.color;
    // In all cases except the team creator, realName seems to be populated, so add it as a default here
    this.realName = isEmpty(opts.realName) ? this.name : opts.realName;

    //this.tz = isUndefined(opts.tz) ? null : opts.tz;
    //this.tzLabel = isUndefined(opts.tzLabel) ? null : opts.tzLabel;
    //this.tzOffset = isUndefined(opts.tzOffset) ? null : opts.tzOffset;

    // What's in the profile object isn't that easy to predict from the sample objects, so just leave it as is.
    // NOTE: Only the image_* fields are guaranteed to be included in the profile
    this.profile = opts.profile;

    this.presence = isEmpty(opts.presence) ? 'active' : opts.presence;

    this.isAdmin = isEmpty(opts.isAdmin) ? false : opts.isAdmin;
    this.isOwner = isEmpty(opts.isOwner) ? false : opts.isOwner;
    this.isPrimaryOwner = isEmpty(opts.isPrimaryOwner) ? false : opts.isPrimaryOwner;
    this.isRestricted = isEmpty(opts.isRestricted) ? false : opts.isRestricted;
    this.isUltraRestricted = isEmpty(opts.isUltraRestricted) ? false : opts.isUltraRestricted;
    this.isBot = isEmpty(opts.isBot) ? false : opts.isBot;
    this.hasFiles = isEmpty(opts.hasFiles) ? true : opts.hasFiles;
    this.has2fa = isEmpty(opts.has2fa) ? false : opts.has2fa;
};


module.exports = User;
