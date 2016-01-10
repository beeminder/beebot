/**
 *
 */

var inherits = require('inherits');

var Model = require('../model');


var File = function (opts) {
    Model.call(this, 'File', opts);
};

inherits(File, Model);


File.prototype.setProperties = function (opts) {
    File.super_.prototype.setProperties.call(this, opts);

    this.id = opts.id;
    this.user = opts.user;
    this.created = opts.created;
    this.timestamp = opts.timestamp;
    this.name = opts.name;
    this.title = opts.title;

    this.mimetype = opts.mimetype;
    this.filetype = opts.filetype;
    this.prettyType = opts.prettyType;

    this.mode = opts.mode;
    this.size = opts.size;
    this.editable = opts.editable;
    this.displayAsBot = opts.displayAsBot;
    this.username = opts.username;

    this.isExternal = opts.isExternal;
    this.externalType = opts.externalType;

    this.isPublic = opts.isPublic;
    this.publicUrlShared = opts.publicUrlShared;

    this.url = opts.url;
    this.urlDownload = opts.urlDownload;
    this.urlPrivate = opts.urlPrivate;
    this.urlPrivateDownload = opts.urlPrivateDownload;
    this.permalink = opts.permalink;
    this.permalinkPublic = opts.permalinkPublic;

    this.thumb64 = opts.thumb64;
    this.thumb80 = opts.thumb80;
    this.thumb160 = opts.thumb160;
    this.thumb360W = opts.thumb360W;
    this.thumb360H = opts.thumb360H;
    this.thumb480 = opts.thumb480;
    this.thumb480W = opts.thumb480W;
    this.thumb480H = opts.thumb480H;
    this.thumb720 = opts.thumb720;
    this.thumb720W = opts.thumb720W;
    this.thumb720H = opts.thumb720H;

    this.imageExifRotation = opts.imageExifRotation;
    this.originalW = opts.originalW;
    this.originalH = opts.originalH;

    this.commentsCount = opts.commentsCount;
    this.channels = opts.channels;
    this.groups = opts.groups;
    this.dms = opts.ims;
    this.reactions = opts.reactions;

};


module.exports = File;
