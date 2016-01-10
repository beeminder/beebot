/**
 *
 */

var inherits = require('inherits');

var Model = require('../model');


var UserGroup = function(opts) {
    Model.call(this, 'UserGroup', opts);
};

inherits(UserGroup, Model);


UserGroup.prototype.setProperties = function(opts) {
    UserGroup.super_.prototype.setProperties.call(this, opts);

    this.id = opts.id;
    this.teamId = opts.teamId;
    this.isUsergroup = opts.isUsergroup;
    this.name = opts.name;
    this.description = opts.description;
    this.handle = opts.handle;
    this.isExternal = opts.isExternal;

    this.dateCreate = opts.dateCreate;
    this.dateUpdate = opts.dateUpdate;
    this.dateDelete = opts.dateDelete;

    this.autoType = opts.autoType;

    this.createdBy = opts.createdBy;
    this.updatedBy = opts.updatedBy;
    this.deletedBy = opts.deletedBy;

    this.prefs = {
        channels: opts.prefs.channels,
        groups: opts.prefs.groups
    };
    this.users = opts.users;
    this.userCount = opts.userCount;
};


module.exports = UserGroup;
